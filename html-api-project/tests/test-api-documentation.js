/**
 * API文档测试脚本
 * 用于验证api-documentation.md中的API接口描述是否与实际代码实现一致
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 全局API对象
const API = require('../js/api.js');

// 读取API文档
function readApiDocumentation() {
  try {
    const docPath = path.resolve('/app/sand-project/api-documentation.md');
    const content = fs.readFileSync(docPath, 'utf8');
    return content;
  } catch (error) {
    console.error('读取API文档失败:', error.message);
    throw error;
  }
}

// 读取API实现代码
function readApiImplementation() {
  try {
    const apiJsPath = path.resolve('/app/sand-project/html-api-project/js/api.js');
    const serverJsPath = path.resolve('/app/sand-project/html-api-project/js/server.js');
    
    const apiJsContent = fs.readFileSync(apiJsPath, 'utf8');
    const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
    
    return {
      apiJs: apiJsContent,
      serverJs: serverJsContent
    };
  } catch (error) {
    console.error('读取API实现代码失败:', error.message);
    throw error;
  }
}

// 解析API文档中的接口信息
function parseApiDocumentation(content) {
  const apiEndpoints = [];
  const apiFunctions = [];
  
  // 解析REST API端点
  const endpointRegex = /### (.+?)\n\n[\s\S]+?- \*\*URL\*\*: `([^`]+)`\n- \*\*方法\*\*: `([^`]+)`/g;
  let match;
  
  while ((match = endpointRegex.exec(content)) !== null) {
    const name = match[1].trim();
    const url = match[2].trim();
    const method = match[3].trim();
    
    // 提取参数信息
    const paramSection = content.substring(match.index);
    const paramEndIndex = paramSection.indexOf('### ') > 0 ? 
                          paramSection.indexOf('### ', 10) : 
                          paramSection.length;
    const sectionContent = paramSection.substring(0, paramEndIndex);
    
    // 提取路径参数
    const pathParams = [];
    const pathParamRegex = /\*\*路径参数\*\*:\s*\n([\s\S]+?)(?:\n\n|\*\*查询参数|$)/;
    const pathParamMatch = sectionContent.match(pathParamRegex);
    if (pathParamMatch) {
      const paramLines = pathParamMatch[1].split('\n');
      for (const line of paramLines) {
        const paramMatch = line.match(/- `([^`]+)`:/);
        if (paramMatch) {
          pathParams.push(paramMatch[1]);
        }
      }
    }
    
    // 提取查询参数
    const queryParams = [];
    const queryParamRegex = /\*\*查询参数\*\*:\s*\n([\s\S]+?)(?:\n\n|\*\*请求体|$)/;
    const queryParamMatch = sectionContent.match(queryParamRegex);
    if (queryParamMatch) {
      const paramLines = queryParamMatch[1].split('\n');
      for (const line of paramLines) {
        const paramMatch = line.match(/- `([^`]+)`:/);
        if (paramMatch) {
          queryParams.push(paramMatch[1]);
        }
      }
    }
    
    // 提取请求体参数
    const bodyParams = [];
    const bodyParamRegex = /\*\*请求体参数\*\*:\s*\n([\s\S]+?)(?:\n\n|\*\*返回值|$)/;
    const bodyParamMatch = sectionContent.match(bodyParamRegex);
    if (bodyParamMatch) {
      const paramLines = bodyParamMatch[1].split('\n');
      for (const line of paramLines) {
        const paramMatch = line.match(/- `([^`]+)`:/);
        if (paramMatch) {
          bodyParams.push(paramMatch[1]);
        }
      }
    }
    
    apiEndpoints.push({
      name,
      url,
      method,
      pathParams,
      queryParams,
      bodyParams
    });
  }
  
  // 解析API函数
  const functionRegex = /### (.+?)\n\n[\s\S]+?- \*\*函数名\*\*: `([^`]+)`/g;
  
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1].trim();
    const functionName = match[2].trim();
    
    // 提取参数信息
    const paramSection = content.substring(match.index);
    const paramEndIndex = paramSection.indexOf('### ') > 0 ? 
                          paramSection.indexOf('### ', 10) : 
                          paramSection.length;
    const sectionContent = paramSection.substring(0, paramEndIndex);
    
    // 提取函数参数
    const params = [];
    const paramRegex = /\*\*参数\*\*:\s*\n([\s\S]+?)(?:\n\n|\*\*返回值|$)/;
    const paramMatch = sectionContent.match(paramRegex);
    if (paramMatch) {
      const paramLines = paramMatch[1].split('\n');
      for (const line of paramLines) {
        const paramMatch = line.match(/- `([^`]+)`:/);
        if (paramMatch) {
          params.push(paramMatch[1]);
        }
      }
    }
    
    apiFunctions.push({
      name,
      functionName,
      params
    });
  }
  
  return {
    endpoints: apiEndpoints,
    functions: apiFunctions
  };
}

// 检查API端点是否在服务器代码中实现
function checkApiEndpointsImplementation(endpoints, serverJs) {
  const results = [];
  
  for (const endpoint of endpoints) {
    const { url, method } = endpoint;
    
    // 构建路由匹配模式
    const routePattern = url.replace(/:[^/]+/g, '[^/]+');
    const routeRegex = new RegExp(`apiRouter\\.(${method.toLowerCase()})\\(['"](${routePattern})['"]`);
    
    const isImplemented = routeRegex.test(serverJs);
    
    results.push({
      endpoint,
      isImplemented,
      message: isImplemented ? 
        `✅ API端点 ${method} ${url} 已实现` : 
        `❌ API端点 ${method} ${url} 未实现`
    });
  }
  
  return results;
}

// 检查API函数是否在API.js中实现
function checkApiFunctionsImplementation(functions, apiJs) {
  const results = [];
  
  for (const func of functions) {
    const { functionName } = func;
    
    // 检查函数是否在API.js中定义
    const functionRegex = new RegExp(`async\\s+${functionName}\\s*\\(`);
    const isImplemented = functionRegex.test(apiJs);
    
    results.push({
      function: func,
      isImplemented,
      message: isImplemented ? 
        `✅ API函数 ${functionName} 已实现` : 
        `❌ API函数 ${functionName} 未实现`
    });
  }
  
  return results;
}

// 检查API参数是否与实现一致
function checkApiParametersConsistency(endpoints, serverJs) {
  const results = [];
  
  for (const endpoint of endpoints) {
    const { url, method, pathParams, queryParams, bodyParams } = endpoint;
    
    // 构建路由匹配模式
    const routePattern = url.replace(/:[^/]+/g, '[^/]+');
    const routeRegex = new RegExp(`apiRouter\\.(${method.toLowerCase()})\\(['"](${routePattern})['"]\\s*,\\s*async\\s*\\(req,\\s*res\\)\\s*=>\\s*{([\\s\\S]+?)\\}\\);`);
    
    const match = serverJs.match(routeRegex);
    if (!match) {
      results.push({
        endpoint,
        isConsistent: false,
        message: `❌ 无法找到 ${method} ${url} 的实现代码`
      });
      continue;
    }
    
    const handlerCode = match[3];
    
    // 检查路径参数
    let isPathParamsConsistent = true;
    for (const param of pathParams) {
      const paramRegex = new RegExp(`req\\.params\\.${param}`);
      if (!paramRegex.test(handlerCode)) {
        isPathParamsConsistent = false;
        results.push({
          endpoint,
          isConsistent: false,
          message: `❌ 路径参数 ${param} 在 ${method} ${url} 的实现中未使用`
        });
      }
    }
    
    // 检查查询参数
    let isQueryParamsConsistent = true;
    for (const param of queryParams) {
      const paramRegex = new RegExp(`req\\.query\\.${param}`);
      if (!paramRegex.test(handlerCode)) {
        isQueryParamsConsistent = false;
        results.push({
          endpoint,
          isConsistent: false,
          message: `❌ 查询参数 ${param} 在 ${method} ${url} 的实现中未使用`
        });
      }
    }
    
    // 检查请求体参数
    let isBodyParamsConsistent = true;
    for (const param of bodyParams) {
      const paramRegex = new RegExp(`req\\.body\\.${param}`);
      if (!paramRegex.test(handlerCode)) {
        isBodyParamsConsistent = false;
        results.push({
          endpoint,
          isConsistent: false,
          message: `❌ 请求体参数 ${param} 在 ${method} ${url} 的实现中未使用`
        });
      }
    }
    
    if (isPathParamsConsistent && isQueryParamsConsistent && isBodyParamsConsistent) {
      results.push({
        endpoint,
        isConsistent: true,
        message: `✅ ${method} ${url} 的参数与实现一致`
      });
    }
  }
  
  return results;
}

// 检查API函数参数是否与实现一致
function checkApiFunctionParametersConsistency(functions, apiJs) {
  const results = [];
  
  for (const func of functions) {
    const { functionName, params } = func;
    
    // 查找函数定义
    const functionRegex = new RegExp(`async\\s+${functionName}\\s*\\(([^)]*)\\)`);
    const match = apiJs.match(functionRegex);
    
    if (!match) {
      results.push({
        function: func,
        isConsistent: false,
        message: `❌ 无法找到函数 ${functionName} 的定义`
      });
      continue;
    }
    
    const paramString = match[1];
    const implementedParams = paramString.split(',').map(p => p.trim());
    
    // 检查参数是否一致
    let isConsistent = true;
    for (const param of params) {
      // 检查参数是否在实现中存在（考虑可选参数和默认值）
      const paramExists = implementedParams.some(p => 
        p === param || p.startsWith(`${param} =`) || p.startsWith(`${param}=`)
      );
      
      if (!paramExists) {
        isConsistent = false;
        results.push({
          function: func,
          isConsistent: false,
          message: `❌ 参数 ${param} 在函数 ${functionName} 的实现中未定义`
        });
      }
    }
    
    if (isConsistent) {
      results.push({
        function: func,
        isConsistent: true,
        message: `✅ 函数 ${functionName} 的参数与实现一致`
      });
    }
  }
  
  return results;
}

// 运行测试
async function runTests() {
  console.log('开始测试API文档与实现的一致性...\n');
  
  try {
    // 读取文档和实现代码
    const apiDoc = readApiDocumentation();
    const { apiJs, serverJs } = readApiImplementation();
    
    // 解析API文档
    const { endpoints, functions } = parseApiDocumentation(apiDoc);
    
    console.log(`从API文档中解析出 ${endpoints.length} 个API端点和 ${functions.length} 个API函数\n`);
    
    // 检查API端点实现
    console.log('检查API端点实现:');
    const endpointResults = checkApiEndpointsImplementation(endpoints, serverJs);
    endpointResults.forEach(result => console.log(result.message));
    
    // 检查API函数实现
    console.log('\n检查API函数实现:');
    const functionResults = checkApiFunctionsImplementation(functions, apiJs);
    functionResults.forEach(result => console.log(result.message));
    
    // 检查API参数一致性
    console.log('\n检查API参数一致性:');
    const paramResults = checkApiParametersConsistency(endpoints, serverJs);
    paramResults.forEach(result => console.log(result.message));
    
    // 检查API函数参数一致性
    console.log('\n检查API函数参数一致性:');
    const funcParamResults = checkApiFunctionParametersConsistency(functions, apiJs);
    funcParamResults.forEach(result => console.log(result.message));
    
    // 统计结果
    const endpointImplemented = endpointResults.filter(r => r.isImplemented).length;
    const functionImplemented = functionResults.filter(r => r.isImplemented).length;
    const paramConsistent = paramResults.filter(r => r.isConsistent).length;
    const funcParamConsistent = funcParamResults.filter(r => r.isConsistent).length;
    
    console.log('\n测试结果统计:');
    console.log(`API端点实现: ${endpointImplemented}/${endpoints.length}`);
    console.log(`API函数实现: ${functionImplemented}/${functions.length}`);
    console.log(`API参数一致性: ${paramConsistent}/${endpoints.length}`);
    console.log(`API函数参数一致性: ${funcParamConsistent}/${functions.length}`);
    
    const totalTests = endpoints.length * 2 + functions.length * 2;
    const passedTests = endpointImplemented + functionImplemented + paramConsistent + funcParamConsistent;
    
    console.log(`\n总体通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('\n✅ 所有测试通过，API文档与实现完全一致!');
    } else {
      console.log('\n⚠️ 部分测试未通过，API文档与实现存在不一致!');
    }
    
  } catch (error) {
    console.error('测试执行失败:', error);
  }
}

// 执行测试
runTests();