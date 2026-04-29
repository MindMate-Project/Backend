import axios, { AxiosRequestConfig } from "axios";

export async function axiosWithRetry(
  config: AxiosRequestConfig,
  retries = 3,
  delayMs = 2000
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios(config);
    } catch (err: any) {
      const status = err?.response?.status;
      const isLast = attempt === retries;

      if (status === 429 && !isLast) {
        const wait = delayMs * attempt; 
        console.warn(`[Axios] 429 received. Retrying in ${wait}ms... (attempt ${attempt}/${retries})`);
        await new Promise(res => setTimeout(res, wait));
      } else {
        throw err;
      }
    }
  }
}