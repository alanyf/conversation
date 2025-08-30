const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Node.js版本的流式查询函数
 * @param {Object} options - 配置选项
 * @param {Object} options.params - 请求参数
 * @param {string} options.params.url - 请求URL
 * @param {string} [options.params.method='GET'] - 请求方法
 * @param {Object} [options.params.body] - 请求体
 * @param {Object} [options.params.headers] - 请求头
 * @param {Function} options.onChange - 数据变化回调函数
 * @param {Function} [options.onFinish] - 完成回调函数
 * @param {Function} [options.onError] - 错误回调函数
 * @param {Function} [options.chunkTransform] - 数据块转换函数
 * @returns {Object} 返回包含abort方法的对象
 */
const streamQuery = ({
  params,
  onStart,
  onChange,
  onFinish,
  onError,
  chunkTransform
}) => {
  const { url, method = 'GET', body, headers = {} } = params;
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const requestModule = isHttps ? https : http;

  const requestOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  let fullText = '';
  let aborted = false;

  const req = requestModule.request(requestOptions, (res) => {
    if (res.statusCode !== 200) {
      let errorData = '';
      res.on('data', (chunk) => {
        errorData += chunk;
      });
      res.on('end', () => {
        const error = new Error(`${res.statusMessage}\n${errorData}`);
        onError?.(error);
      });
      return;
    }

    res.setEncoding('utf8');

    // 监听第一个数据块
    res.once('data', (chunk) => {
      onStart?.();
    });

    res.on('data', (chunk) => {
      if (aborted) return;
      const chunkStr = chunk?.toString();
      const transformedChunk = chunkTransform ? chunkTransform(chunkStr) : chunkStr;
      fullText += transformedChunk;
      onChange(transformedChunk, fullText);
    });

    res.on('end', () => {
      if (!aborted) {
        onFinish?.();
      }
    });

    res.on('error', (error) => {
      if (!aborted) {
        console.error('Response error:', error);
        onError?.(error);
      }
    });
  });

  req.on('error', (error) => {
    if (!aborted) {
      console.error('Request error:', error);
      onError?.(error);
    }
  });
  // 发送请求体（如果是POST请求）
  if (method === 'POST' && body) {
    req.write(JSON.stringify(body));
  }

  req.end();

  return {
    abort: () => {
      aborted = true;
      req.destroy();
      console.log('Request aborted');
    }
  };
};

module.exports = { streamQuery };
