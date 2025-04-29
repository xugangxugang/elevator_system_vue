import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import router from './router/index';

import zhCn from 'element-plus/es/locale/lang/zh-cn';
const app = createApp(App);

// 使用 element-plus 插件

app.use(ElementPlus, {
    locale: zhCn, // 设置全局语言为中文
  });
// 使用 pinia 状态管理库
const pinia = createPinia();
app.use(pinia);

// 使用 vue-router 路由管理器
app.use(router);

app.mount('#app');
    