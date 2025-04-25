// Script to create sample audio files
document.addEventListener('DOMContentLoaded', function() {
    console.log('Creating sample audio files...');
    
    // Function to convert base64 to blob
    function base64ToBlob(base64, mime) {
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([ab], { type: mime });
    }
    
    // Function to download blob as file
    function saveBlob(blob, fileName) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    }
    
    // Create a simple tone audio file
    // This is a short, base64-encoded MP3 audio of a simple tone
 