export function toggleFullscreen() {
    if (document.fullscreenElement === document.documentElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
}