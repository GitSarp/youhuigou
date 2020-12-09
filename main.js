import Vue from 'vue'
import App from './App'
//剪贴板功能
import ican from './js_sdk/ican-H5Api/ican-H5Api.js'

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()
