import { apiRequest } from './queryClient';

type RequestConfig = { url?: string; method?: string; data?: any; headers?: Record<string, string> };

type Interceptor = (cfg: RequestConfig) => void;
const requestInterceptors: Interceptor[] = [];

function runRequestInterceptors(cfg: RequestConfig) {
  requestInterceptors.forEach(fn => {
    try { fn(cfg); } catch { /* ignore */ }
  });
}

async function get<T>(url: string) {
  const cfg: RequestConfig = { url, method: 'get' };
  runRequestInterceptors(cfg);
  const data = await apiRequest('GET', url);
  return { data } as { data: T };
}

async function post<T>(url: string, dataArg: any, config?: { headers?: Record<string, string> }) {
  const cfg: RequestConfig = { url, method: 'post', data: dataArg, headers: config?.headers };
  runRequestInterceptors(cfg);
  const data = await apiRequest('POST', url, dataArg);
  return { data } as { data: T };
}

export const api = {
  get,
  post,
  interceptors: {
    request: {
      use(fn: Interceptor) { requestInterceptors.push(fn); }
    }
  }
};

export default api;
