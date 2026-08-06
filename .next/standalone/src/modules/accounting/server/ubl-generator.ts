/**
 * NexaB2B E-Fatura UBL-TR XML Jeneratörü
 * GİB (Gelir İdaresi Başkanlığı) standartlarına uygun basitleştirilmiş UBL 2.1 yapısı.
 */

export interface InvoiceData {
  id: string;
  uuid: string;
  issueDate: string;
  issueTime: string;
  invoiceTypeCode: "SATIS" | "IADE" | "ISTISNA" | "SEVK";
  currencyCode: string;
  orderNumber?: string;
  orderDate?: string;
  customer: {
    name: string;
    taxId: string;
    taxOffice?: string;
    address: string;
    city: string;
    country: string;
  };
  supplier: {
    name: string;
    taxId: string;
    taxOffice: string;
    address: string;
    city: string;
    country: string;
  };
  items: {
    name: string;
    quantity: number;
    unitCode: string;
    price: number;
    taxRate: number;
  }[];
}

export function generateUBLXML(data: InvoiceData): string {
  const totalTaxAmount = data.items.reduce((acc, item) => acc + (item.price * item.quantity * item.taxRate / 100), 0);
  const totalLineExtensionAmount = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalInclusiveAmount = totalLineExtensionAmount + totalTaxAmount;

  const orderRefXml = data.orderNumber ? `
    <cac:OrderReference>
        <cbc:ID>${data.orderNumber}</cbc:ID>
        <cbc:IssueDate>${data.orderDate || data.issueDate}</cbc:IssueDate>
    </cac:OrderReference>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 http://www.oasis-open.org/committees/ubl/schema/xsd/UBL-Invoice-2.1.xsd">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>TEMELFATURA</cbc:ProfileID>
    <cbc:ID>${data.id}</cbc:ID>
    <cbc:UUID>${data.uuid}</cbc:UUID>
    <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>${data.invoiceTypeCode}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${data.currencyCode}</cbc:DocumentCurrencyCode>${orderRefXml}
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:WebsiteURI>https://nexab2b.com</cbc:WebsiteURI>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${data.supplier.taxId}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${data.supplier.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${data.supplier.address}</cbc:StreetName>
                <cbc:CityName>${data.supplier.city}</cbc:CityName>
                <cbc:Country>
                    <cbc:Name>${data.supplier.country}</cbc:Name>
                </cbc:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${data.supplier.taxOffice}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${data.customer.taxId}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${data.customer.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${data.customer.address}</cbc:StreetName>
                <cbc:CityName>${data.customer.city}</cbc:CityName>
                <cbc:Country>
                    <cbc:Name>${data.customer.country}</cbc:Name>
                </cbc:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${data.currencyCode}">${totalTaxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${data.currencyCode}">${totalLineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${data.currencyCode}">${totalTaxAmount.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${data.currencyCode}">${totalLineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${data.currencyCode}">${totalLineExtensionAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${data.currencyCode}">${totalInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${data.currencyCode}">${totalInclusiveAmount.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${data.items.map((item, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${item.unitCode}">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${data.currencyCode}">${(item.price * item.quantity).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${data.currencyCode}">${(item.price * item.quantity * item.taxRate / 100).toFixed(2)}</cbc:TaxAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${data.currencyCode}">${item.price.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `).join('')}
</Invoice>`;
}
