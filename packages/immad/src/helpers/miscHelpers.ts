/**
 * This function will take a url to a file and download it with out triggering
 * the before unload if there is no save. This is due the title bing file which
 * the function for alertUserUnsavedState will detect and no trigger the alert
 * but let the file download.
 * @param fileUrl the full url to the file that needs to be downloaded.
 */
export function downloadFile(fileUrl: string): void {
    const a = window.document.createElement('a');
    a.href = fileUrl;
    a.title = 'file';
    const fileName = fileUrl.split('/').pop();
    if (fileName !== null) {
        a.download = fileName;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
