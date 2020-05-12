(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{180:function(t,e,r){t.exports=r.p+"assets/img/http_request_format.1d151e01.jpg"},181:function(t,e,r){t.exports=r.p+"assets/img/http_request_package.35316077.png"},182:function(t,e,r){t.exports=r.p+"assets/img/http_response_format.7f6977df.png"},183:function(t,e,r){t.exports=r.p+"assets/img/http_response_package.61909ccd.png"},184:function(t,e,r){t.exports=r.p+"assets/img/http_tcp_stream.55bd56cf.png"},213:function(t,e,r){"use strict";r.r(e);var a=r(6),s=Object(a.a)({},(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"http-基础"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#http-基础"}},[t._v("#")]),t._v(" HTTP 基础")]),t._v(" "),a("p",[t._v("HTTP（超文本传输协议）是构建在应用层的文本传输协议，基于 TCP/IP 协议栈。")]),t._v(" "),a("h2",{attrs:{id:"无状态"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#无状态"}},[t._v("#")]),t._v(" 无状态")]),t._v(" "),a("p",[t._v("在通信层面，http 每个请求都是完全独立的，每个请求包含了处理这个请求所需的完整的数据，发送请求不涉及到状态变更。即使在HTTP/1.1上，同一个连接允许传输多个HTTP请求的情况下，如果第一个请求出错了，后面的请求一般也能够继续处理（当然，如果导致协议解析失败、消息分片错误之类的自然是要除外的）。")]),t._v(" "),a("h3",{attrs:{id:"参考"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#参考"}},[t._v("#")]),t._v(" 参考")]),t._v(" "),a("ul",[a("li",[a("a",{attrs:{href:"https://www.zhihu.com/question/23202402/answer/527748675",target:"_blank",rel:"noopener noreferrer"}},[t._v("HTTP是一个无状态的协议。这句话里的无状态是什么意思"),a("OutboundLink")],1)])]),t._v(" "),a("h2",{attrs:{id:"请求数据包格式"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#请求数据包格式"}},[t._v("#")]),t._v(" 请求数据包格式")]),t._v(" "),a("p",[t._v("HTTP 请求报文由请求行、请求头、空行和请求体 4 个部分组成，如下图所示：")]),t._v(" "),a("p",[a("img",{attrs:{src:r(180),alt:"request_format"}}),a("br"),t._v("\n下面是在 linux 下本地执行 "),a("code",[t._v("curl http://localhost:8081/ping")]),t._v(" 的抓包结果，可以很清楚的与报文格式内容一一对应，注意从抓包的结果来看，最后的空行包含 "),a("code",[t._v("\\r\\n（回车符和换行符）")]),t._v(" 两个字符，由于使用的 GET 请求，所以没有请求体。")]),t._v(" "),a("p",[a("img",{attrs:{src:r(181),alt:"request_package"}})]),t._v(" "),a("h2",{attrs:{id:"响应数据包格式"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#响应数据包格式"}},[t._v("#")]),t._v(" 响应数据包格式")]),t._v(" "),a("p",[t._v("HTTP 响应报文由状态行、响应头、空行和 响应体 4 个部分组成，如下图所示：")]),t._v(" "),a("p",[a("img",{attrs:{src:r(182),alt:"response_format"}})]),t._v(" "),a("p",[t._v("抓包结果如下，")]),t._v(" "),a("p",[a("img",{attrs:{src:r(183),alt:"response_package"}})]),t._v(" "),a("p",[t._v("响应体由于 wirshark 输出的样式不太友好，点击 TCP Stream 整体来看就是这样：")]),t._v(" "),a("p",[a("img",{attrs:{src:r(184),alt:"tcp_stream"}})]),t._v(" "),a("p",[t._v("值得注意的是，在响应体的第一行是一个 "),a("code",[t._v("10")]),t._v("， 第二行是响应内容 "),a("code",[t._v('{"message":"ok"}')]),t._v(", 第三行是 "),a("code",[t._v("0")]),t._v("。实际上这是由于服务器的传输格式为 "),a("a",{attrs:{href:"https://blog.csdn.net/u014569188/article/details/78912469",target:"_blank",rel:"noopener noreferrer"}},[t._v("Transfer-Encoding: chunked"),a("OutboundLink")],1),t._v("导致的，服务端以流的形式返回数据，是没办法预先知道 "),a("code",[t._v("content-length")]),t._v(" 的，所以会先发一个十六进制的值作为接下来要发送的内容的长度，比如这里发送的是 "),a("code",[t._v("10")]),t._v("， 转换成十进制为 16，也就是说接下来要发送 16 个字节。最后末尾发送一个 "),a("code",[t._v("0")]),t._v("，代表着服务端数据已经全部返回。")]),t._v(" "),a("h2",{attrs:{id:"请求方法"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#请求方法"}},[t._v("#")]),t._v(" 请求方法")]),t._v(" "),a("h2",{attrs:{id:"响应码"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#响应码"}},[t._v("#")]),t._v(" 响应码")]),t._v(" "),a("ul",[a("li",[t._v("401 （Unauthorized），实际上 401 表示未认证，也就是没有带认证信息或者认证信息错误，应该单词 "),a("code",[t._v("Unauthenticated")]),t._v(" 的意思。")]),t._v(" "),a("li",[t._v("403 （Forbidden），资源请求被拒绝，一般是认证通过了，但是该用户没有访问改资源的权限，这里才应该用 "),a("code",[t._v("Unauthorized")]),t._v("。")]),t._v(" "),a("li",[t._v("499，nginx 独有的状态码，当客户端主动关闭了连接，nginx 会在 access log 中记录成 499。")])]),t._v(" "),a("h3",{attrs:{id:"参考-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#参考-2"}},[t._v("#")]),t._v(" 参考")]),t._v(" "),a("ul",[a("li",[a("a",{attrs:{href:"https://juejin.im/post/5ad04750518825558b3e57bd",target:"_blank",rel:"noopener noreferrer"}},[t._v("HTTP状态码401和403深度解析"),a("OutboundLink")],1)])]),t._v(" "),a("h2",{attrs:{id:"清单"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#清单"}},[t._v("#")]),t._v(" 清单")]),t._v(" "),a("ul",[a("li",[a("a",{attrs:{href:"https://developer.mozilla.org/zh-CN/docs/Web/HTTP",target:"_blank",rel:"noopener noreferrer"}},[t._v("MDN HTTP"),a("OutboundLink")],1)])])])}),[],!1,null,null,null);e.default=s.exports}}]);