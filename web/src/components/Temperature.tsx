import { Input, Progress } from "@chatui/core";
import { Icon } from "@iconify/react";
import Style from "./Temperature.module.less";

type TemperatureProps = {
  value: number;
  onPlus: () => void;
  onMinus: () => void;
};

function Temperature(props: TemperatureProps) {
  const { value, onPlus, onMinus } = props;
  return (
    <div>
      <h4 className={Style.temperature_title_box}>
        温度系数
        <Input value={value / 100} disabled={true} />
      </h4>
      <div className={Style.temperature_box}>
        <Icon
          className={Style.temperature_btn}
          icon="ph:minus-circle"
          onClick={onMinus}
        />
        <Progress value={value} className={Style.progress_container} />
        <Icon
          className={Style.temperature_btn}
          icon="bi:plus-circle"
          onClick={onPlus}
        />
      </div>
    </div>
  );
}

export default Temperature;
