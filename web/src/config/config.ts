const version:string = '1.0.1.0';

let apiBaseDomain: string = "";
console.log(import.meta.env.VITE_SERVER_TAG_NODE);
switch (import.meta.env.VITE_SERVER_TAG_NODE) {
    case 'dev':
        apiBaseDomain = '/';
        break;
    case 'prod':
        apiBaseDomain = '/';
        break;
    default:
        apiBaseDomain = 'http://127.0.0.1:8080';
}

export default {
  version,
  apiBaseDomain,
};
