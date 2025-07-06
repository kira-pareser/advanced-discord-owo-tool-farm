import axios from "axios";

/**
 * Downloads an attachment from the specified URL and returns its contents as a Buffer.
 *
 * @param url - The URL of the attachment to download.
 * @returns A promise that resolves to a Buffer containing the downloaded data.
 * @throws Will throw an error if the HTTP request fails.
 */
export const downloadAttachment = async (url: string): Promise<Buffer> => {
    const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            "Content-Type": "application/octet-stream",
        },
    });
    return Buffer.from(response.data);
};
