// Solid CSS geometry, not a bitmap face. All measurements use the model's unit.
export function floppyModel(brand='garcy'){
 const tesseral=brand==='tesseral';
 return `<span class="floppy-model ${tesseral?'floppy-green':'floppy-yellow'}" aria-hidden="true">
 <span class="floppy-face floppy-back"><span class="floppy-hub"></span><span class="floppy-back-groove"></span></span>
 <span class="floppy-edge floppy-edge-left"></span><span class="floppy-edge floppy-edge-right"></span><span class="floppy-edge floppy-edge-top"></span><span class="floppy-edge floppy-edge-bottom"></span>
 <span class="floppy-face floppy-front"><span class="floppy-grain"></span><span class="floppy-track"></span><span class="floppy-arrow">↑</span><span class="floppy-emboss">${tesseral?'t':'s'}*</span><span class="floppy-shutter"><span class="floppy-shutter-slot"></span><span class="floppy-metal-etch">HD · 1.44 MB</span></span><span class="floppy-label"><span class="floppy-logo-wrap"><span class="floppy-logo-text">SiteFast.by</span></span><span class="floppy-label-rule"></span><span class="floppy-edition">${tesseral?'DIGITAL SYSTEMS':'САЙТЫ И ИИ-АГЕНТЫ'}<br>АРХИВ СТУДИИ / 0${tesseral?'2':'1'}</span><span class="floppy-barcode"></span><span class="floppy-serial">SF—2026</span></span><span class="floppy-notch notch-left"></span><span class="floppy-notch notch-right"></span><span class="floppy-seam"></span></span>
 </span>`;
}
