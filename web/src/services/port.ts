import serviceAxios from "./request";
import {getCookie} from "../utils/cookie";

export const getUserInfo = () => {
    return serviceAxios({
        url: "auth/info",
        method: "post",
    });
};

export const login = (params: Object) => {
    return serviceAxios({
        url: "user/auth",
        method: "post",
        data: params,
    });
};

export const completion = (chatContext:any) => {
    return serviceAxios({
        url: "chat/completion",
        method: "post",
        data: {
            messages: chatContext,
        },
    });
};

export const completionStream = (chatContext: any, model: string) => {

    let dataObj = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + getCookie("mojolicious")
        },
        body: JSON.stringify({
            messages: chatContext,
            model: model
        })
    }

    return fetch('/chat/completion', dataObj);
}
