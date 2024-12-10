// ==UserScript==
// @name         无锡学院校园网自动登录
// @namespace    unist
// @version      0.5
// @description  自动登录无锡学院校园网，支持GET请求方式登录
// @author       仟羽
// @match        http://10.1.99.100/*
// @icon         https://toolb.cn/favicon/www.cwxu.edu.cn
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 添加按钮样式
    GM_addStyle(`
        #wxxy-login-btn {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            padding: 8px 16px !important;
            background: #4CAF50 !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        #wxxy-login-btn:hover {
            background: #43A047 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        #wxxy-login-btn.logged-in {
            background: #666 !important;
            cursor: not-allowed !important;
        }
        /* 配置面板样式 */
        .config-panel {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: white !important;
            padding: 30px !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
            z-index: 999999 !important;
            display: none;
            min-width: 320px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            animation: fadeIn 0.3s ease !important;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -48%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
        }

        .config-panel.show {
            display: block !important;
        }

        .config-panel h3 {
            margin: 0 0 25px 0 !important;
            color: #333 !important;
            font-size: 20px !important;
            font-weight: 500 !important;
            text-align: center !important;
        }

        .config-panel .input-group {
            margin-bottom: 20px !important;
            position: relative !important;
        }

        .config-panel label {
            display: block !important;
            margin-bottom: 8px !important;
            color: #666 !important;
            font-size: 14px !important;
            font-weight: 500 !important;
        }

        .config-panel input[type="text"],
        .config-panel input[type="password"],
        .config-panel select {
            width: 100% !important;
            padding: 10px 12px !important;
            border: 2px solid #e0e0e0 !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
            outline: none !important;
            box-sizing: border-box !important;
        }

        .config-panel input[type="text"]:focus,
        .config-panel input[type="password"]:focus,
        .config-panel select:focus {
            border-color: #2196F3 !important;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1) !important;
        }

        .config-panel .checkbox-group {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            margin-top: 15px !important;
        }

        .config-panel input[type="checkbox"] {
            width: 16px !important;
            height: 16px !important;
            margin: 0 !important;
        }

        .config-panel .buttons {
            display: flex !important;
            justify-content: flex-end !important;
            gap: 12px !important;
            margin-top: 25px !important;
            padding-top: 20px !important;
            border-top: 1px solid #eee !important;
        }

        .config-panel button {
            padding: 10px 20px !important;
            border: none !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: all 0.3s ease !important;
        }

        .config-panel button.save {
            background: #2196F3 !important;
            color: white !important;
        }

        .config-panel button.save:hover {
            background: #1976D2 !important;
            transform: translateY(-1px) !important;
        }

        .config-panel button.cancel {
            background: #f5f5f5 !important;
            color: #666 !important;
        }

        .config-panel button.cancel:hover {
            background: #e0e0e0 !important;
        }

        .config-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0,0,0,0.5) !important;
            z-index: 999998 !important;
            display: none;
            backdrop-filter: blur(2px) !important;
            animation: fadeIn 0.3s ease !important;
        }

        .config-overlay.show {
            display: block !important;
        }
        #wxxy-config-btn {
            position: fixed !important;
            top: 20px !important;
            right: 120px !important;
            z-index: 999999 !important;
            padding: 8px 16px !important;
            background: #2196F3 !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        #wxxy-config-btn:hover {
            background: #1976D2 !important;
            transform: translateY(-1px) !important;
        }
    `);

    // 移除默认配置对象,改用本地存储初始化
    let CONFIG = {};

    // 登录状态
    let isLoggedIn = false;

    // 创建登录按钮
    function createLoginButton() {
        const existingBtn = document.getElementById('wxxy-login-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        const btn = document.createElement('button');
        btn.id = 'wxxy-login-btn';
        btn.textContent = isLoggedIn ? '已登录' : '一键登录';
        if (isLoggedIn) {
            btn.classList.add('logged-in');
        }

        btn.addEventListener('click', () => {
            if (!isLoggedIn) {
                login();
            }
        });

        document.body.appendChild(btn);
    }

    // 更新按钮状态
    function updateButtonStatus() {
        const loginBtn = document.getElementById('wxxy-login-btn');
        if (loginBtn) {
            loginBtn.textContent = isLoggedIn ? '已登录' : '一键登录';
            if (isLoggedIn) {
                loginBtn.classList.add('logged-in');
            } else {
                loginBtn.classList.remove('logged-in');
            }
        }
    }

    // 修改加载配置函数
    function loadConfig() {
        const savedConfig = localStorage.getItem('wxxy-config');
        if (savedConfig) {
            CONFIG = JSON.parse(savedConfig);
        } else {
            // 如果没有保存的配置,使用空配置
            CONFIG = {
                username: '',
                password: '',
                operator: '@cmcc',  // 默认选中移动
                autoLogin: false
            };
            // 保存默认配置
            localStorage.setItem('wxxy-config', JSON.stringify(CONFIG));
        }
    }

    // 修改登录函数,添加配置检查
    function login() {
        if (!CONFIG.username || !CONFIG.password || !CONFIG.operator) {
            console.log('请先完成配置');
            // 自动打开配置面板
            const panel = document.querySelector('.config-panel');
            const overlay = document.querySelector('.config-overlay');
            if (panel && overlay) {
                panel.classList.add('show');
                overlay.classList.add('show');
            }
            return;
        }
        
        const account = CONFIG.username + CONFIG.operator;
        const loginUrl = `http://10.1.99.100:801/eportal/portal/login?callback=dr1003&login_method=1&user_account=${account}&user_password=${CONFIG.password}&wlan_user_ip&wlan_user_ipv6=&wlan_user_mac=000000000000&wlan_ac_ip=&wlan_ac_name=&jsVersion=4.1.3&terminal_type=1&lang=zh-cn&v=3043&lang=zh`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: loginUrl,
            onload: (response) => {
                const text = response.responseText;
                console.log('登录响应:', text);
                
                if (text.includes('"result":1') || text.includes('已经在线')) {
                    console.log('登录成功');
                    isLoggedIn = true;
                    updateButtonStatus();
                    // 只在手动点击登录按钮时刷新页面
                    if (!CONFIG.autoLogin) {
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                } else {
                    console.log('登录失败');
                    isLoggedIn = false;
                    updateButtonStatus();
                }
            },
            onerror: (error) => {
                console.error('登录请求失败:', error);
                isLoggedIn = false;
                updateButtonStatus();
            }
        });
    }

    // 检查登录状态
    function checkNeedLogin() {
        // 检查是否存在登录表单
        const needLogin = document.querySelector('input[type="password"]') !== null;
        // 检查是否显示"您已经成功登录"
        const successMessage = document.body.textContent.includes('您已经成功登录');
        
        isLoggedIn = !needLogin || successMessage;
        updateButtonStatus();
        return needLogin && !successMessage;
    }

    // 创建配置面板
    function createConfigPanel() {
        const panel = document.createElement('div');
        panel.className = 'config-panel';
        panel.innerHTML = `
            <h3>校园网登录配置</h3>
            <div class="input-group">
                <label>学号</label>
                <input type="text" id="config-username" value="${CONFIG.username}" placeholder="请输入学号">
            </div>
            <div class="input-group">
                <label>密码</label>
                <input type="password" id="config-password" value="${CONFIG.password}" placeholder="请输入密码">
            </div>
            <div class="input-group">
                <label>运营商</label>
                <select id="config-operator">
                    <option value="@cmcc" ${CONFIG.operator === '@cmcc' ? 'selected' : ''}>中国移动</option>
                    <option value="@unicom" ${CONFIG.operator === '@unicom' ? 'selected' : ''}>中国联通</option>
                    <option value="@telecom" ${CONFIG.operator === '@telecom' ? 'selected' : ''}>中国电信</option>
                    <option value="@campus" ${CONFIG.operator === '@campus' ? 'selected' : ''}>校园网</option>
                </select>
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="config-autologin" ${CONFIG.autoLogin ? 'checked' : ''}>
                <label for="config-autologin">自动登录</label>
            </div>
            <div class="buttons">
                <button class="cancel">取消</button>
                <button class="save">保存配置</button>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'config-overlay';

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // 绑定事件
        panel.querySelector('.save').addEventListener('click', () => {
            CONFIG.username = document.getElementById('config-username').value;
            CONFIG.password = document.getElementById('config-password').value;
            CONFIG.operator = document.getElementById('config-operator').value;
            CONFIG.autoLogin = document.getElementById('config-autologin').checked;
            
            panel.classList.remove('show');
            overlay.classList.remove('show');
            
            // 保存到本地存储
            localStorage.setItem('wxxy-config', JSON.stringify(CONFIG));
        });

        panel.querySelector('.cancel').addEventListener('click', () => {
            panel.classList.remove('show');
            overlay.classList.remove('show');
        });

        return { panel, overlay };
    }

    // 创建配置按钮
    function createConfigButton() {
        const btn = document.createElement('button');
        btn.id = 'wxxy-config-btn';
        btn.textContent = '配置';
        
        btn.addEventListener('click', () => {
            const panel = document.querySelector('.config-panel');
            const overlay = document.querySelector('.config-overlay');
            if (panel && overlay) {
                panel.classList.add('show');
                overlay.classList.add('show');
            }
        });

        document.body.appendChild(btn);
    }

    // 修改初始化函数
    window.addEventListener('load', () => {
        loadConfig();
        createLoginButton();
        createConfigButton();
        createConfigPanel();
        checkNeedLogin();
        if (CONFIG.autoLogin && !isLoggedIn) {
            login();
        }
    });

    // 修改观察者，确保配置按钮也始终存在
    const observer = new MutationObserver(() => {
        if (!document.getElementById('wxxy-login-btn')) {
            createLoginButton();
        }
        if (!document.getElementById('wxxy-config-btn')) {
            createConfigButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})(); 
