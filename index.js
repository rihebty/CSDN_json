// ==UserScript==
// @name         CSDN文章解锁助手
// @version      0.1.0
// @description  解锁CSDN付费文章,支持导出MD格式
// @author       You
// @match        *.csdn.net/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/marked/marked.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery@1.12.4/dist/jquery.min.js
// ==/UserScript==

(function () {
    'use strict';

    // 添加样式
    GM_addStyle(`
        .tool-box {
            margin: 10px 0;
        }
        .tool-btn {
            padding: 5px 10px;
            margin-right: 10px;
            background: #007BFF;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .tool-btn:hover {
            background: #0056b3;
        }
        .overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        }
        .modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 5px;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
        }
        .modal textarea {
            width: 100%;
            min-height: 300px;
            margin: 10px 0;
        }
    `);

    // HTML转MD函数
    function html2md(htmlData) {
        let codeContent = new Array;
        let preContent = new Array;
        let tableContent = new Array;
        let olContent = new Array;
        let imgContent = new Array;
        let aContent = new Array;
        let pureHtml = htmlData;

        function clearHtmlTag(sourceData = '') {
            return sourceData.replace(/\<[\s\S]*?\>/g, '')
        }

        // ... existing html2md conversion logic ...

        // 显示结果
        showModal(pureHtml.trim());
    }

    // 显示模态框
    function showModal(content) {
        const modal = document.createElement('div');
        modal.className = 'overlay';
        modal.innerHTML = `
            <div class="modal">
                <h3>Markdown格式</h3>
                <textarea readonly>${content}</textarea>
                <button class="tool-btn" onclick="this.closest('.overlay').style.display='none'">关闭</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    // 解锁文章
    function unlockArticle() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://cdn.jsdelivr.net/gh/rihebty/CSDN_json@main/index.json",
            headers: {
                "Content-Type": "application/json"
            },
            onload: function (sourceResponse) {
                try {
                    const sources = JSON.parse(sourceResponse.responseText);

                    if (!sources || !sources.length) {
                        alert('获取解析源失败');
                        return;
                    }

                    const source = sources.find(s => s.status);
                    if (!source) {
                        alert('没有可用的解析源');
                        return;
                    }

                    const url = window.location.href.match(/^[^#?]*/)[0];

                    // 发送解析请求
                    GM_xmlhttpRequest({
                        method: source.method,
                        url: source.method === 'GET' ?
                            source.link.replace(/\[\]/, url) :
                            source.link,
                        data: source.method === 'POST' ?
                            JSON.stringify({ ...source.data, url }) :
                            null,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        onload: function (response) {
                            if (response.status === 200) {
                                const data = JSON.parse(response.responseText);
                                if (data.code == source.code) {
                                    const content = source.content.split('.').reduce(
                                        (acc, key) => acc && acc[key],
                                        data
                                    );

                                    if (source.type === 'html') {
                                        const win = window.open();
                                        win.document.write(content);
                                        win.document.title = '解锁内容';
                                    } else {
                                        window.open(content);
                                    }
                                } else {
                                    alert('解析失败: ' + data.message);
                                }
                            }
                        },
                        onerror: function () {
                            alert('请求失败');
                        }
                    });

                } catch (err) {
                    alert('解锁失败: ' + err.message);
                }
            },
            onerror: function () {
                alert('获取解析源失败');
            }
        });
    }
    // 添加按钮
    function addButtons() {
        const btnBox = document.createElement('div');
        btnBox.className = 'tool-box';
        btnBox.innerHTML = `
            <button class="tool-btn unlock-btn">解锁文章</button>
        `;

        const title = document.querySelector('.article-title-box');
        if (title) {
            title.appendChild(btnBox);

            // 绑定事件
            btnBox.querySelector('.unlock-btn').onclick = unlockArticle;
            btnBox.querySelector('.md-btn').onclick = () => {
                const article = document.getElementById("article_content");
                if (article) {
                    html2md(article.outerHTML);
                }
            };
        }
    }

    // 初始化
    function init() {
        // 检查是否是文章页面
        if (location.href.includes('/article/details/')) {
            // 等待页面加载完成
            const checkReady = setInterval(() => {
                if (document.querySelector('.article-title-box')) {
                    clearInterval(checkReady);
                    addButtons();
                }
            }, 100);
        }
    }

    init();
})();
