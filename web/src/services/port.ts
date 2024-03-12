import serviceAxios from "./request";
import {getCookie} from "../utils/cookie";
import config from "../config/config";

export const getUserInfo = () => {
    return serviceAxios({
        url: config.apiBaseDomain + "/auth/info",
        method: "post",
    });
};

export const login = (params: Object) => {
    return serviceAxios({
        url: config.apiBaseDomain + "/user/auth",
        method: "post",
        data: params,
    });
};

export const completion = (chatContext:any) => {
    return serviceAxios({
        url: config.apiBaseDomain + "/chat/completion",
        method: "post",
        data: {
            messages: chatContext,
        },
    });
};

export const completionStream = (params:string) => {

    let dataObj = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + getCookie("mojolicious")
        },
        body: params
    }

    return fetch(config.apiBaseDomain + '/chat/completion', dataObj);
}
