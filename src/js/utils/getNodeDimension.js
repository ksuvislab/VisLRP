export default function(nodes) {
    switch (nodes) {
        case 64: return [8, 8];
        case 128: return [8, 16];
        case 256: return [16, 16];
        case 512: return [16, 32];
        case 4096: return [64, 64];
        default: return [3, 1];
    }
}