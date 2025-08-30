/**
 * 从 SiliconFlow 模型的响应 chunk 中提取实际内容
 * @param {string} chunk - 包含 SiliconFlow 响应的 chunk 字符串
 * @returns {string} - 提取后的实际内容
 */
function extractContentFromSiliconFlowChunk (chunk) {
  const data = chunk.trim();
  const response = data
    .split('data: ')
    .filter(item => item && !item.includes('[DONE]'))
    .map(item => {
      try {
        const json = JSON.parse(item.trim());
        const delta = json?.choices?.[0]?.delta;
        const res = delta?.content ?? delta?.reasoning_content ?? '';
        return res;
      } catch (e) {
        console.log(e);
        return '';
      }
    })
    .filter(item => item)
    .join('');
  return response;
}

/**
 * 从 Ptaas 模型的响应 chunk 中提取实际内容
 * @param {string} chunk - 包含 Ptaas 响应的 chunk 字符串
 * @returns {string} - 提取后的实际内容
 */
function extractContentFromPtaasChunk (chunk) {
  let response = chunk
    .replaceAll('\n\ndata: ', '')
    .replaceAll('\ndata: ', '')
    .replaceAll('data: ', '');
  if (response.endsWith('\n\n')) {
    response = response.slice(0, -2);
  }
  return response;
}

module.exports = {
  extractContentFromPtaasChunk,
  extractContentFromSiliconFlowChunk
};
