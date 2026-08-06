module.exports=[193695,(e,c,r)=>{c.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},814747,(e,c,r)=>{c.exports=e.x("path",()=>require("path"))},918622,(e,c,r)=>{c.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,c,r)=>{c.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,c,r)=>{c.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,c,r)=>{c.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,c,r)=>{c.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},522734,(e,c,r)=>{c.exports=e.x("fs",()=>require("fs"))},478500,(e,c,r)=>{c.exports=e.x("node:async_hooks",()=>require("node:async_hooks"))},660526,(e,c,r)=>{c.exports=e.x("node:os",()=>require("node:os"))},509656,(e,c,r)=>{c.exports=e.x("node:tty",()=>require("node:tty"))},902157,(e,c,r)=>{c.exports=e.x("node:fs",()=>require("node:fs"))},750227,(e,c,r)=>{c.exports=e.x("node:path",()=>require("node:path"))},666680,(e,c,r)=>{c.exports=e.x("node:crypto",()=>require("node:crypto"))},874533,(e,c,r)=>{c.exports=e.x("node:child_process",()=>require("node:child_process"))},912714,(e,c,r)=>{c.exports=e.x("node:fs/promises",()=>require("node:fs/promises"))},812057,(e,c,r)=>{c.exports=e.x("node:util",()=>require("node:util"))},59639,(e,c,r)=>{c.exports=e.x("node:process",()=>require("node:process"))},687769,(e,c,r)=>{c.exports=e.x("node:events",()=>require("node:events"))},410430,(e,c,r)=>{c.exports=e.x("async_hooks",()=>require("async_hooks"))},254799,(e,c,r)=>{c.exports=e.x("crypto",()=>require("crypto"))},689960,e=>{"use strict";let c=new Uint8Array(16),r=[];for(let e=0;e<256;++e)r.push((e+256).toString(16).slice(1));e.s(["v4",0,function(e,t,a){return t||e||!crypto.randomUUID?function(e,t,a){let o=(e=e||{}).random??e.rng?.()??crypto.getRandomValues(c);if(o.length<16)throw Error("Random bytes length must be >= 16");if(o[6]=15&o[6]|64,o[8]=63&o[8]|128,t){if((a=a||0)<0||a+16>t.length)throw RangeError(`UUID byte range ${a}:${a+15} is out of buffer bounds`);for(let e=0;e<16;++e)t[a+e]=o[e];return t}return function(e,c=0){return(r[e[c+0]]+r[e[c+1]]+r[e[c+2]]+r[e[c+3]]+"-"+r[e[c+4]]+r[e[c+5]]+"-"+r[e[c+6]]+r[e[c+7]]+"-"+r[e[c+8]]+r[e[c+9]]+"-"+r[e[c+10]]+r[e[c+11]]+r[e[c+12]]+r[e[c+13]]+r[e[c+14]]+r[e[c+15]]).toLowerCase()}(o)}(e,t,a):crypto.randomUUID()}],689960)},673945,e=>{"use strict";e.s(["generateUBLXML",0,function(e){let c=e.items.reduce((e,c)=>e+c.price*c.quantity*c.taxRate/100,0),r=e.items.reduce((e,c)=>e+c.price*c.quantity,0),t=r+c,a=e.orderNumber?`
    <cac:OrderReference>
        <cbc:ID>${e.orderNumber}</cbc:ID>
        <cbc:IssueDate>${e.orderDate||e.issueDate}</cbc:IssueDate>
    </cac:OrderReference>`:"";return`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 http://www.oasis-open.org/committees/ubl/schema/xsd/UBL-Invoice-2.1.xsd">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>TEMELFATURA</cbc:ProfileID>
    <cbc:ID>${e.id}</cbc:ID>
    <cbc:UUID>${e.uuid}</cbc:UUID>
    <cbc:IssueDate>${e.issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${e.issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>${e.invoiceTypeCode}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${e.currencyCode}</cbc:DocumentCurrencyCode>${a}
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:WebsiteURI>https://nexab2b.com</cbc:WebsiteURI>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${e.supplier.taxId}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${e.supplier.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${e.supplier.address}</cbc:StreetName>
                <cbc:CityName>${e.supplier.city}</cbc:CityName>
                <cbc:Country>
                    <cbc:Name>${e.supplier.country}</cbc:Name>
                </cbc:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${e.supplier.taxOffice}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${e.customer.taxId}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${e.customer.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${e.customer.address}</cbc:StreetName>
                <cbc:CityName>${e.customer.city}</cbc:CityName>
                <cbc:Country>
                    <cbc:Name>${e.customer.country}</cbc:Name>
                </cbc:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${e.currencyCode}">${c.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${e.currencyCode}">${r.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${e.currencyCode}">${c.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${e.currencyCode}">${r.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${e.currencyCode}">${r.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${e.currencyCode}">${t.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${e.currencyCode}">${t.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${e.items.map((c,r)=>`
    <cac:InvoiceLine>
        <cbc:ID>${r+1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${c.unitCode}">${c.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${e.currencyCode}">${(c.price*c.quantity).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${e.currencyCode}">${(c.price*c.quantity*c.taxRate/100).toFixed(2)}</cbc:TaxAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${c.name}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${e.currencyCode}">${c.price.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `).join("")}
</Invoice>`}])},230228,e=>{e.v(c=>Promise.all(["server/chunks/src_lib_14qzqfj._.js"].map(c=>e.l(c))).then(()=>c(454088)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__1d4cbme._.js.map