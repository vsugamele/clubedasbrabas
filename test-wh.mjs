import { Webhook } from 'standardwebhooks';

const secret = "AOY4lzZos2TOIm+dv0hpk3cLXOWo1RSAyEzzHmpeyMDMTckIFReWB4lmJy+rM1/AMKDLorZCKLyF13V2";

try {
    new Webhook("whsec_" + secret);
    console.log("whsec_ Success");
} catch (e) {
    console.error("whsec_ Error:", e.message);
}

try {
    new Webhook(secret);
    console.log("raw Success");
} catch (e) {
    console.error("raw Error:", e.message);
}

// Another test without + and /
const secret2 = "AOY4lzZos2TOImdv0hpk3cLXOWo1RSAyEzzHmpeyMDMTckIFReWB4lmJyrM1AMKDLorZCKLyF13V2";
try {
    new Webhook("whsec_" + secret2);
    console.log("whsec_ Success 2");
} catch (e) {
    console.error("whsec_ Error 2:", e.message);
}
