import "./chat.css";
import css from "../../App.module.css";
import "../../chatui-theme.css";
import Chat, {
  Bubble,
  Button,
  Input,
  MessageProps,
  Modal,
  Progress,
  RadioGroup,
  toast,
  useMessages,
} from "@chatui/core";
import "@chatui/core/dist/index.css";
import "@chatui/core/es/styles/index.less";
import { SetStateAction, useState } from "react";
import MdEditor from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import sanitizeHtml from "sanitize-html";
import { completion, completionStream } from "../../services/port";
import { RadioValue } from "@chatui/core/lib/components/Radio/Radio";
import Style from "./index.module.less";

const defaultQuickReplies = [
  {
    name: "模型配置",
    isNew: true,
    isHighlight: true,
  },
  {
    name: "清空会话",
    isNew: false,
    isHighlight: true,
  },
  // {
  //     name: '复制会话',
  //     isNew: false,
  //     isHighlight: true,
  // },
];

const initialMessages = [
  {
    type: "text",
    content: {
      text: "您好，我是您的AI助理，您可以问我您遇到的问题!",
    },
    user: { avatar: "//gitclone.com/download1/gitclone.png" },
  },
];

let chatContext: any[] = [];

function App() {
  const { messages, appendMsg, updateMsg, setTyping, prependMsgs } =
    useMessages(initialMessages);
  const [percentage, setPercentage] = useState(0);
  const [value, setValue] = useState<RadioValue>("gpt-3.5-turbo");
  const [maxTokens, setMaxTokens] = useState<string>("512");
  const [botDesc, setBotDesc] = useState<string>("");
  const [percentageParam, setPercentageParam] = useState(20);

  const [open, setOpen] = useState<boolean>(false);

  function handleClose() {
    setOpen(false);
  }

  function handleConfirm() {
    setOpen(false);
  }

  const handleFocus = () => {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 10);
  };

  // clearQuestion 清空文本特殊字符
  function clearQuestion(requestText: string) {
    requestText = requestText.replace(/\s/g, "");
    const punctuation = ",.;!?，。！？、…";
    const runeRequestText = requestText.split("");
    const lastChar = runeRequestText[runeRequestText.length - 1];
    if (punctuation.indexOf(lastChar) < 0) {
      requestText = requestText + "。";
    }
    return requestText;
  }

  // clearQuestion 清空文本换行符号
  function clearReply(reply: string) {
    // TODO 清洗回复特殊字符
    return reply;
  }

  function handleSend(type: string, val: string) {
    if (percentage > 0) {
      toast.fail("正在等待上一次回复，请稍后");
      return;
    }
    if (type === "text" && val.trim()) {
      appendMsg({
        type: "text",
        content: { text: val },
        position: "right",
        user: { avatar: "//gitclone.com/download1/user.png" },
      });

      setTyping(true);
      setPercentage(10);
      onGenCode(val);
    }
  }

  function renderMessageContent(msg: MessageProps) {
    const { type, content } = msg;

    switch (type) {
      case "text":
        let text = content.text;
        let isHtml = sanitizeHtml(text) !== text;
        const richTextRegex = /(<[^>]+>)|(```[^`]*```)/gi;
        const isRichText = richTextRegex.test(text);
        if (isHtml || isRichText) {
          return (
            <Bubble>
              <MdEditor
                style={{ float: "left" }}
                modelValue={text} // 要展示的markdown字符串
                previewOnly={true} // 只展示预览框部分
              ></MdEditor>
            </Bubble>
          );
        } else {
          return <Bubble>{text}</Bubble>;
        }

      default:
        return null;
    }
  }

  async function handleQuickReplyClick(item: { name: string }) {
    if (item.name === "清空会话") {
      chatContext.splice(0);
      messages.splice(0);
      prependMsgs(messages);
    }

    if (item.name === "模型配置") {
      setOpen(true);
    }
    // if (item.name === '复制会话') {
    //     if (messages.length <= 1) {
    //         return
    //     }
    //     const r = messages
    //         .slice(1)
    //         .filter((it) => it.type === 'text')
    //         .map((it) => it.content.text)
    //         .join('\n')
    //     console.log('messages', messages, r)
    //     await clipboardy.write(r)
    //     toast.success('复制成功', 10_000)
    // }
  }

  async function onGenCode(question: string) {
    question = clearQuestion(question);
    chatContext.push({
      role: "user",
      content: question,
    });

    // 生成随机id
    const id = Math.random().toString(36).substr(2);
    // 将maxTokens转为int
    const params = JSON.stringify({
      messages: chatContext,
      model: value,
      max_tokens: parseInt(maxTokens), // 转为int
      bot_desc: botDesc,
    });
    const res = await completionStream(params);
    if (res.ok && res.body) {
      appendMsg({
        _id: id,
        type: "text",
        content: { text: "test" },
        user: { avatar: "//gitclone.com/download1/gitclone.png" },
      });

      let shownText = "";
      let renderMarkdown = false;

      let checkConsecutiveChars = function (str: string, symbol = "`") {
        const pattern = new RegExp("(" + symbol + ")\\1{1,}");
        return pattern.test(str);
      };

      // @ts-ignore
      let getStream = function (
        reader: ReadableStreamDefaultReader<Uint8Array>,
      ) {
        return reader.read().then(function (result) {
          // 如果数据已经读取完毕，直接返回
          if (result.done) {
            setPercentage(0);
            console.log(889, "result done");
            return;
          }
          // 取出本段数据（二进制格式）
          let chunk = result.value;
          const text = new TextDecoder("utf-8").decode(chunk);
          const lines = text.split("\n");

          lines.forEach((line: string) => {
            // 查找line中是否有data:字段
            const dataPos = line.indexOf("data:");
            if (dataPos > -1) {
              const data = line.slice(dataPos + 5);
              if (data === "finish" || data === "<!finish>") {
                setPercentage(0);
                console.log(889, "finish");
                return;
              }
              let tmpData;
              try {
                tmpData = JSON.parse(data);
              } catch (e) {
                console.log(889, "parse error");
                return;
              }

              if (checkConsecutiveChars(tmpData.delta.content, "`")) {
                if (!renderMarkdown) {
                  shownText += "``````";
                }
                renderMarkdown = !renderMarkdown;
              }

              if (renderMarkdown) {
                // 删除tmpData.delta.content中的```符号
                // tmpData.delta.content = tmpData.delta.content.replace(/```/g, '');
                // 从shownText最后的```之前开始插入字符串
                const lastMarkdown = shownText.lastIndexOf("```");
                shownText =
                  shownText.slice(0, lastMarkdown) +
                  tmpData.delta.content +
                  shownText.slice(lastMarkdown);
                console.log(shownText);
              } else {
                shownText += tmpData.delta.content;
              }
            }
          });
          updateMsg(id, {
            type: "text",
            content: { text: shownText },
            user: { avatar: "//gitclone.com/download1/gitclone.png" },
          });
          return getStream(reader);
        });
      };
      await getStream(res.body.getReader());
    } else {
      setPercentage(0);
      return toast.fail("请求出错，请稍后再试!", undefined);
    }
  }
  function handleChange(val: RadioValue) {
    setValue(val);
  }

  const options = [
    { label: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
    { label: "gpt-4", value: "gpt-4" },
  ];

  return (
    <div className={css.app}>
      <Chat
        navbar={{
          leftContent: {
            icon: "chevron-left",
            title: "Back",
          },
          rightContent: [
            {
              icon: "apps",
              title: "Applications",
            },
            {
              icon: "ellipsis-h",
              title: "More",
            },
          ],
          title: "ChatGPT的AI问答助手",
        }}
        messages={messages}
        renderMessageContent={renderMessageContent}
        quickReplies={defaultQuickReplies}
        onQuickReplyClick={handleQuickReplyClick}
        onSend={handleSend}
        onInputFocus={handleFocus}
      />
      <Progress value={percentage} />
      {/*@ts-ignore*/}
      <Modal
        active={open}
        title="模型配置"
        showClose={false}
        onClose={handleClose}
        actions={[
          {
            label: "返回",
            onClick: handleClose,
          },
        ]}
      >
        <div>
          <h4>模型配置</h4>
          <RadioGroup value={value} options={options} onChange={handleChange} />
        </div>
        <div>
          <h4>AI特征</h4>
          <Input
            rows={3}
            value={botDesc}
            onChange={val => setBotDesc(val)}
            placeholder="你是一个AI助手，我需要你模拟一名专业工程师来回答我的问题!"
          />
        </div>

        <div>
          <h4>请求最大字符数</h4>
          <Input
            value={maxTokens}
            onChange={val => setMaxTokens(val)}
            placeholder="GPT请求最大字符数"
          />
        </div>
      </Modal>
    </div>
  );
}

export default App;
