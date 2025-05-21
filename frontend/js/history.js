/**
 * Docker历史记录页面的JavaScript文件
 * 实现用户名输入、Docker列表查询和详细信息展示功能
 */

// API基础URL
const API_BASE_URL = 'http://localhost:3000';

// 当前选中的Docker ID
let currentDockerId = null;

// 当前用户名
let currentUsername = '';

// 排序设置
let sortSettings = {
    field: 'createdAt',
    direction: 'desc'
};

// 原始Docker列表数据
let originalDockerList = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面已加载完成');
    init();
});

/**
 * 初始化函数
 */
function init() {
    // 在控制台输出欢迎信息
    console.log('欢迎使用Docker历史记录页面');
    
    // 检查localStorage中是否已有用户名，如果有则自动填充
    loadUsername();
    
    // 添加事件监听器
    addEventListeners();
}

/**
 * 从localStorage加载用户名
 */
function loadUsername() {
    const savedUsername = localStorage.getItem('username');
    
    if (savedUsername) {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = savedUsername;
            console.log('已从localStorage加载用户名:', savedUsername);
        }
        
        // 如果已有用户名，自动查询Docker列表
        currentUsername = savedUsername;
        showDockerHistorySection();
        loadDockerList(savedUsername);
    }
}

/**
 * 保存用户名到localStorage
 * @param {string} username - 要保存的用户名
 */
function saveUsername(username) {
    if (username) {
        localStorage.setItem('username', username);
        console.log('用户名已保存到localStorage:', username);
    }
}

/**
 * 验证表单
 * @param {string} username - 要验证的用户名
 * @returns {boolean} 验证结果
 */
function validateForm(username) {
    const errorElement = document.getElementById('error-message');
    
    // 清除之前的错误信息
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    // 验证用户名不能为空
    if (!username || username.trim() === '') {
        if (errorElement) {
            errorElement.textContent = '用户名不能为空！';
        }
        return false;
    }
    
    return true;
}

/**
 * 添加事件监听器
 */
function addEventListeners() {
    // 为用户表单添加提交事件监听器
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            // 阻止表单默认提交行为
            event.preventDefault();
            
            // 获取用户名输入
            const usernameInput = document.getElementById('username');
            const username = usernameInput ? usernameInput.value : '';
            
            // 验证表单
            if (validateForm(username)) {
                // 保存用户名到localStorage
                saveUsername(username);
                currentUsername = username;
                
                // 显示Docker历史记录部分
                showDockerHistorySection();
                
                // 加载Docker列表
                loadDockerList(username);
            }
        });
    }
    
    // 为返回按钮添加点击事件监听器
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            // 隐藏详细信息部分，显示列表部分
            hideDockerDetailSection();
            showDockerHistorySection();
        });
    }
    
    // 为刷新按钮添加点击事件监听器
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            if (currentUsername) {
                // 添加加载状态
                refreshButton.classList.add('loading');
                
                // 加载Docker列表
                loadDockerList(currentUsername)
                    .finally(() => {
                        // 无论成功或失败，移除加载状态
                        refreshButton.classList.remove('loading');
                    });
            }
        });
    }
    
    // 为排序字段选择器添加事件监听器
    const sortFieldSelect = document.getElementById('sortField');
    if (sortFieldSelect) {
        sortFieldSelect.addEventListener('change', function() {
            sortSettings.field = this.value;
            sortAndDisplayDockerList();
        });
    }
    
    // 为排序方向选择器添加事件监听器
    const sortDirectionSelect = document.getElementById('sortDirection');
    if (sortDirectionSelect) {
        sortDirectionSelect.addEventListener('change', function() {
            sortSettings.direction = this.value;
            sortAndDisplayDockerList();
        });
    }
}

/**
 * 显示Docker历史记录部分
 */
function showDockerHistorySection() {
    const dockerHistorySection = document.getElementById('dockerHistorySection');
    if (dockerHistorySection) {
        dockerHistorySection.style.display = 'block';
    }
    
    // 隐藏详细信息部分
    hideDockerDetailSection();
}

/**
 * 隐藏Docker历史记录部分
 */
function hideDockerHistorySection() {
    const dockerHistorySection = document.getElementById('dockerHistorySection');
    if (dockerHistorySection) {
        dockerHistorySection.style.display = 'none';
    }
}

/**
 * 显示Docker详细信息部分
 */
function showDockerDetailSection() {
    const dockerDetailSection = document.getElementById('dockerDetailSection');
    if (dockerDetailSection) {
        dockerDetailSection.style.display = 'block';
    }
    
    // 隐藏历史记录部分
    hideDockerHistorySection();
}

/**
 * 隐藏Docker详细信息部分
 */
function hideDockerDetailSection() {
    const dockerDetailSection = document.getElementById('dockerDetailSection');
    if (dockerDetailSection) {
        dockerDetailSection.style.display = 'none';
    }
}

/**
 * 加载用户的Docker列表
 * @param {string} username - 用户名
 * @returns {Promise} - 加载完成的Promise
 */
async function loadDockerList(username) {
    try {
        const dockerListElement = document.getElementById('dockerList');
        if (!dockerListElement) return;
        
        // 显示加载中提示
        dockerListElement.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">正在加载数据...</div>
            </div>
        `;
        
        // 调用API获取Docker列表
        const response = await fetch(`${API_BASE_URL}/api/docker/list/${username}`);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const dockerList = await response.json();
        
        // 保存原始数据
        originalDockerList = dockerList;
        
        // 排序并显示Docker列表
        sortAndDisplayDockerList();
        
    } catch (error) {
        console.error('加载Docker列表失败:', error);
        const dockerListElement = document.getElementById('dockerList');
        if (dockerListElement) {
            dockerListElement.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠</div>
                    <div class="error-content">
                        <div class="error-title">加载失败</div>
                        <div class="error-message">${error.message}</div>
                        <button class="retry-button" onclick="loadDockerList('${username}')">重试</button>
                    </div>
                </div>
            `;
        }
    }
}

/**
 * 排序并显示Docker列表
 */
function sortAndDisplayDockerList() {
    const dockerListElement = document.getElementById('dockerList');
    if (!dockerListElement) return;
    
    // 清空容器
    dockerListElement.innerHTML = '';
    
    // 检查是否有Docker实例
    if (!originalDockerList || originalDockerList.length === 0) {
        dockerListElement.innerHTML = '<div class="no-data">没有找到Docker实例</div>';
        return;
    }
    
    // 对Docker列表进行排序
    const sortedList = [...originalDockerList].sort((a, b) => {
        let valueA, valueB;
        
        // 根据排序字段获取值
        switch (sortSettings.field) {
            case 'name':
                valueA = a.name || '';
                valueB = b.name || '';
                break;
            case 'status':
                valueA = a.status || '';
                valueB = b.status || '';
                break;
            case 'createdAt':
            default:
                valueA = new Date(a.createdAt || a.startedAt || 0).getTime();
                valueB = new Date(b.createdAt || b.startedAt || 0).getTime();
                break;
        }
        
        // 根据排序方向进行比较
        if (sortSettings.direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    // 创建表格显示Docker列表
    const table = document.createElement('table');
    table.className = 'docker-table';
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // 定义表头及其是否可排序
    const headers = [
        { text: 'ID', field: null },
        { text: '名称', field: 'name' },
        { text: '状态', field: 'status' },
        { text: '创建时间', field: 'createdAt' },
        { text: '操作', field: null }
    ];
    
    headers.forEach(header => {
        const th = document.createElement('th');
        
        if (header.field) {
            th.className = 'sortable';
            if (sortSettings.field === header.field) {
                th.classList.add(sortSettings.direction === 'asc' ? 'sort-asc' : 'sort-desc');
            }
            
            th.addEventListener('click', () => {
                if (sortSettings.field === header.field) {
                    // 切换排序方向
                    sortSettings.direction = sortSettings.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    // 更改排序字段
                    sortSettings.field = header.field;
                    sortSettings.direction = 'desc'; // 默认降序
                }
                
                // 更新排序选择器的值
                const sortFieldSelect = document.getElementById('sortField');
                const sortDirectionSelect = document.getElementById('sortDirection');
                if (sortFieldSelect) sortFieldSelect.value = sortSettings.field;
                if (sortDirectionSelect) sortDirectionSelect.value = sortSettings.direction;
                
                // 重新排序并显示
                sortAndDisplayDockerList();
            });
        }
        
        th.textContent = header.text;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    sortedList.forEach(docker => {
        const row = document.createElement('tr');
        
        // ID列（显示短ID）
        const idCell = document.createElement('td');
        idCell.textContent = docker.containerId.substring(0, 12);
        row.appendChild(idCell);
        
        // 名称列
        const nameCell = document.createElement('td');
        nameCell.textContent = docker.name || '未命名';
        row.appendChild(nameCell);
        
        // 状态列
        const statusCell = document.createElement('td');
        statusCell.className = `status-${docker.status || 'unknown'}`;
        
        // 添加状态指示器
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'status-indicator';
        statusCell.appendChild(statusIndicator);
        
        // 添加状态文本
        const statusText = document.createElement('span');
        statusText.className = 'status-text';
        statusText.textContent = docker.status || '未知';
        statusCell.appendChild(statusText);
        
        row.appendChild(statusCell);
        
        // 创建时间列
        const timeCell = document.createElement('td');
        timeCell.textContent = formatDate(docker.createdAt || docker.startedAt);
        row.appendChild(timeCell);
        
        // 操作列
        const actionCell = document.createElement('td');
        const detailButton = document.createElement('button');
        detailButton.className = 'btn btn-small';
        detailButton.textContent = '查看详情';
        detailButton.addEventListener('click', function() {
            loadDockerDetail(docker.containerId);
        });
        actionCell.appendChild(detailButton);
        row.appendChild(actionCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    dockerListElement.appendChild(table);
}

/**
 * 加载Docker详细信息
 * @param {string} dockerId - Docker ID
 */
async function loadDockerDetail(dockerId) {
    try {
        currentDockerId = dockerId;
        
        const dockerDetailElement = document.getElementById('dockerDetail');
        if (!dockerDetailElement) return;
        
        // 显示加载中提示
        dockerDetailElement.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">正在加载详细信息...</div>
            </div>
        `;
        
        // 显示详细信息部分
        showDockerDetailSection();
        
        // 调用API获取Docker详细信息
        const response = await fetch(`${API_BASE_URL}/api/docker/status/${dockerId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const dockerDetail = await response.json();
        
        // 创建详细信息展示
        let detailHTML = '<div class="detail-container">';
        
        // 添加标题和状态
        detailHTML += '<div class="detail-header">';
        detailHTML += `<div>
                          <h3 class="detail-title">${dockerDetail.name || '未命名Docker'}</h3>
                          <div class="detail-id">${dockerDetail.containerId}</div>
                       </div>`;
        detailHTML += `<div class="detail-status-badge ${dockerDetail.status}">${dockerDetail.status}</div>`;
        detailHTML += '</div>';
        
        // 添加基本信息
        detailHTML += '<div class="detail-section">';
        detailHTML += '<h3 class="detail-section-title">基本信息</h3>';
        detailHTML += '<div class="detail-grid">';
        detailHTML += '<div class="detail-item"><span class="detail-label">ID</span> <div class="detail-value">' + dockerDetail.containerId + '</div></div>';
        detailHTML += '<div class="detail-item"><span class="detail-label">名称</span> <div class="detail-value">' + (dockerDetail.name || '未命名') + '</div></div>';
        detailHTML += '<div class="detail-item"><span class="detail-label">状态</span> <div class="detail-value">' + dockerDetail.status + '</div></div>';
        detailHTML += '<div class="detail-item"><span class="detail-label">创建时间</span> <div class="detail-value">' + formatDate(dockerDetail.createdAt) + '</div></div>';
        detailHTML += '<div class="detail-item"><span class="detail-label">启动时间</span> <div class="detail-value">' + formatDate(dockerDetail.startedAt) + '</div></div>';
        detailHTML += '</div></div>';
        
        // 添加系统信息
        if (dockerDetail.platform || dockerDetail.architecture) {
            detailHTML += '<div class="detail-section">';
            detailHTML += '<h3 class="detail-section-title">系统信息</h3>';
            detailHTML += '<div class="detail-grid">';
            if (dockerDetail.platform) {
                detailHTML += '<div class="detail-item"><span class="detail-label">平台</span> <div class="detail-value">' + dockerDetail.platform + '</div></div>';
            }
            if (dockerDetail.architecture) {
                detailHTML += '<div class="detail-item"><span class="detail-label">架构</span> <div class="detail-value">' + dockerDetail.architecture + '</div></div>';
            }
            detailHTML += '</div></div>';
        }
        
        // 添加网络信息
        if (dockerDetail.networkSettings && dockerDetail.networkSettings.IPAddress) {
            detailHTML += '<div class="detail-section">';
            detailHTML += '<h3 class="detail-section-title">网络信息</h3>';
            detailHTML += '<div class="detail-grid">';
            detailHTML += '<div class="detail-item"><span class="detail-label">IP地址</span> <div class="detail-value">' + dockerDetail.networkSettings.IPAddress + '</div></div>';
            detailHTML += '</div></div>';
        }
        
        // 添加日志查看部分
        detailHTML += '<div class="detail-section">';
        detailHTML += '<h3 class="detail-section-title">日志信息</h3>';
        detailHTML += '<button id="viewLogsButton" class="btn btn-primary">查看日志</button>';
        detailHTML += '<div id="logsContainer" class="logs-container" style="display: none;"></div>';
        detailHTML += '</div>';
        
        detailHTML += '</div>';
        
        dockerDetailElement.innerHTML = detailHTML;
        
        // 为日志按钮添加事件监听器
        const viewLogsButton = document.getElementById('viewLogsButton');
        if (viewLogsButton) {
            viewLogsButton.addEventListener('click', function() {
                loadDockerLogs(dockerId);
            });
        }
        
    } catch (error) {
        console.error('加载Docker详细信息失败:', error);
        const dockerDetailElement = document.getElementById('dockerDetail');
        if (dockerDetailElement) {
            dockerDetailElement.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠</div>
                    <div class="error-content">
                        <div class="error-title">加载详细信息失败</div>
                        <div class="error-message">${error.message}</div>
                        <button class="retry-button" onclick="loadDockerDetail('${dockerId}')">重试</button>
                    </div>
                </div>
            `;
        }
    }
}

/**
 * 加载Docker日志
 * @param {string} dockerId - Docker ID
 */
async function loadDockerLogs(dockerId) {
    try {
        const logsContainer = document.getElementById('logsContainer');
        if (!logsContainer) return;
        
        // 如果日志容器已经显示，则隐藏它（切换功能）
        if (logsContainer.style.display === 'block') {
            logsContainer.style.display = 'none';
            return;
        }
        
        // 显示加载中提示
        logsContainer.innerHTML = `
            <div class="logs-header">
                <h4 class="logs-title">日志加载中...</h4>
            </div>
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
            </div>
        `;
        logsContainer.style.display = 'block';
        
        // 调用API获取Docker日志
        const response = await fetch(`${API_BASE_URL}/api/docker/logs/${dockerId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const logs = await response.text();
        
        // 显示日志内容
        if (logs && logs.trim() !== '') {
            // 处理日志内容，添加行号
            const logLines = logs.split('\n');
            let formattedLogs = '';
            
            logLines.forEach((line, index) => {
                if (line.trim() !== '') {
                    formattedLogs += `<div class="logs-line">${line}</div>`;
                }
            });
            
            logsContainer.innerHTML = `
                <div class="logs-header">
                    <h4 class="logs-title">容器日志</h4>
                    <div class="logs-actions">
                        <button class="logs-action-button" id="copyLogsButton">复制</button>
                        <button class="logs-action-button" id="closeLogsButton">关闭</button>
                    </div>
                </div>
                <div class="logs-content">${formattedLogs}</div>
            `;
            
            // 添加复制按钮事件
            const copyLogsButton = document.getElementById('copyLogsButton');
            if (copyLogsButton) {
                copyLogsButton.addEventListener('click', function() {
                    navigator.clipboard.writeText(logs)
                        .then(() => {
                            alert('日志已复制到剪贴板');
                        })
                        .catch(err => {
                            console.error('复制失败:', err);
                            alert('复制失败，请手动选择并复制');
                        });
                });
            }
            
            // 添加关闭按钮事件
            const closeLogsButton = document.getElementById('closeLogsButton');
            if (closeLogsButton) {
                closeLogsButton.addEventListener('click', function() {
                    logsContainer.style.display = 'none';
                });
            }
        } else {
            logsContainer.innerHTML = `
                <div class="logs-header">
                    <h4 class="logs-title">容器日志</h4>
                    <div class="logs-actions">
                        <button class="logs-action-button" id="closeLogsButton">关闭</button>
                    </div>
                </div>
                <div class="no-data">没有可用的日志</div>
            `;
            
            // 添加关闭按钮事件
            const closeLogsButton = document.getElementById('closeLogsButton');
            if (closeLogsButton) {
                closeLogsButton.addEventListener('click', function() {
                    logsContainer.style.display = 'none';
                });
            }
        }
        
    } catch (error) {
        console.error('加载Docker日志失败:', error);
        const logsContainer = document.getElementById('logsContainer');
        if (logsContainer) {
            logsContainer.innerHTML = `
                <div class="logs-header">
                    <h4 class="logs-title">错误</h4>
                    <div class="logs-actions">
                        <button class="logs-action-button" id="closeLogsButton">关闭</button>
                    </div>
                </div>
                <div class="error-container">
                    <div class="error-icon">⚠</div>
                    <div class="error-content">
                        <div class="error-title">加载日志失败</div>
                        <div class="error-message">${error.message}</div>
                        <button class="retry-button" onclick="loadDockerLogs('${dockerId}')">重试</button>
                    </div>
                </div>
            `;
            
            // 添加关闭按钮事件
            const closeLogsButton = document.getElementById('closeLogsButton');
            if (closeLogsButton) {
                closeLogsButton.addEventListener('click', function() {
                    logsContainer.style.display = 'none';
                });
            }
        }
    }
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(dateString) {
    if (!dateString) return '未知';
    
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return dateString; // 如果无法解析，则返回原始字符串
    }
    
    // 格式化为 YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}