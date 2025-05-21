/**
 * API客户端模块
 * 负责与后端API进行交互
 */

const ApiClient = {
    /**
     * 获取所有scenario的列表
     * @returns {Promise<Object>} 包含scenarios列表的响应对象
     */
    async getScenarios() {
        try {
            const response = await fetch('/api/scenarios');
            return await response.json();
        } catch (error) {
            console.error('获取scenarios列表失败:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 获取指定scenario的YAML内容
     * @param {string} scenarioId - scenario的ID
     * @returns {Promise<Object>} 包含scenario YAML内容的响应对象
     */
    async getScenarioYaml(scenarioId) {
        try {
            const response = await fetch(`/api/scenarios/${scenarioId}`);
            return await response.json();
        } catch (error) {
            console.error(`获取scenario ${scenarioId} 失败:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 获取用户在特定scenario下的设置
     * @param {string} username - 用户名
     * @param {string} scenarioId - scenario的ID
     * @returns {Promise<Object>} 包含用户设置的响应对象
     */
    async getUserSettings(username, scenarioId) {
        try {
            const response = await fetch(`/api/scenarios/${scenarioId}/settings/${username}`);
            return await response.json();
        } catch (error) {
            console.error(`获取用户 ${username} 在场景 ${scenarioId} 下的设置失败:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 保存用户在特定scenario下的设置
     * @param {string} username - 用户名
     * @param {string} scenarioId - scenario的ID
     * @param {Object} settings - 要保存的设置对象
     * @returns {Promise<Object>} 保存结果的响应对象
     */
    async saveUserSettings(username, scenarioId, settings) {
        try {
            const response = await fetch(`/api/scenarios/${scenarioId}/settings/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings })
            });
            return await response.json();
        } catch (error) {
            console.error(`保存用户 ${username} 在场景 ${scenarioId} 下的设置失败:`, error);
            return { success: false, error: error.message };
        }
    }
};