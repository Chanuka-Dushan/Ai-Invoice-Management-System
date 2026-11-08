import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { calculateInvoiceTotals, toFixed2 } from '../common/utils/decimal.util';
import { addDays, format } from 'date-fns';

export interface StructuredInvoiceDraft {
  customer: {
    id?: string;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    isExisting: boolean;
  };
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountRate: number;
    taxRate: number;
    lineTotal: number;
  }>;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  shippingAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  termsAndConditions?: string;
  paymentInstructions?: string;
  confidenceScore: number;
  assumptions: string[];
  followUpQuestions: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  async generateInvoiceFromText(companyId: string, prompt: string): Promise<StructuredInvoiceDraft> {
    const startTime = Date.now();
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        customers: {
          where: { isArchived: false },
          select: { id: true, name: true, companyName: true, email: true, phone: true },
        },
      },
    });

    if (!company) {
      throw new Error('Company context not found');
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openAiKey = process.env.OPENAI_API_KEY?.trim();

    let result: StructuredInvoiceDraft | null = null;

    // 1. Try OpenRouter if configured
    if (!result && openRouterKey) {
      try {
        result = await this.callOpenRouterForInvoice(prompt, company, openRouterKey);
      } catch (err: any) {
        this.logger.warn(`OpenRouter API failed: ${err.message}. Trying next available provider.`);
      }
    }

    // 2. Try Gemini if configured
    if (!result && geminiKey) {
      try {
        result = await this.callGeminiForInvoice(prompt, company, geminiKey);
      } catch (err: any) {
        this.logger.warn(`Gemini API failed: ${err.message}. Trying next available provider.`);
      }
    }

    // 3. Try OpenAI if configured
    if (!result && openAiKey) {
      try {
        result = await this.callOpenAiForInvoice(prompt, company, openAiKey);
      } catch (err: any) {
        this.logger.warn(`OpenAI API failed: ${err.message}. Trying local dynamic NLP engine.`);
      }
    }

    // 4. Dynamic local NLP Engine (Zero hardcoding)
    if (!result) {
      result = this.localNlpInvoiceParser(prompt, company);
    }

    // Match customer with existing company customers
    const customerNameLower = (result.customer.name || '').toLowerCase().trim();
    const matchedCustomer = company.customers.find(
      (c) =>
        c.name.toLowerCase() === customerNameLower ||
        (c.companyName && c.companyName.toLowerCase() === customerNameLower) ||
        (customerNameLower.length > 3 &&
          (c.name.toLowerCase().includes(customerNameLower) ||
            customerNameLower.includes(c.name.toLowerCase()))),
    );

    if (matchedCustomer) {
      result.customer.id = matchedCustomer.id;
      result.customer.isExisting = true;
      result.customer.name = matchedCustomer.name;
      result.customer.companyName = matchedCustomer.companyName || undefined;
      result.customer.email = matchedCustomer.email || undefined;
      result.customer.phone = matchedCustomer.phone || undefined;
    }

    // Populate company defaults
    if (!result.currency) {
      result.currency = company.defaultCurrency || 'USD';
    }
    if (!result.paymentInstructions && company.bankDetails) {
      result.paymentInstructions = company.bankDetails;
    }
    if (!result.termsAndConditions && company.defaultPaymentTerms) {
      result.termsAndConditions = company.defaultPaymentTerms;
    }
    if (!result.notes && company.defaultInvoiceFooter) {
      result.notes = company.defaultInvoiceFooter;
    }

    // Re-verify calculations with strict backend logic
    const calc = calculateInvoiceTotals({
      items: result.items,
      discountType: result.discountType,
      discountValue: result.discountValue,
      shippingAmount: result.shippingAmount,
    });

    result.subtotal = calc.subtotal;
    result.taxAmount = calc.taxAmount;
    result.totalAmount = calc.totalAmount;

    // Log AI Job
    await this.prisma.aiJobLog
      .create({
        data: {
          companyId,
          jobType: 'INVOICE_GENERATION',
          promptSummary: prompt.slice(0, 250),
          status: 'SUCCESS',
          durationMs: Date.now() - startTime,
        },
      })
      .catch(() => null);

    return result;
  }

  private async callGeminiForInvoice(prompt: string, company: any, apiKey: string): Promise<StructuredInvoiceDraft> {
    const customersContext = company.customers
      .map((c: any) => `- ID: ${c.id}, Name: ${c.name}, Company: ${c.companyName || 'N/A'}`)
      .join('\n');

    const systemInstruction = `You are InvoiceAI, an AI that converts natural language invoicing instructions into structured JSON.
Current Company Default Currency: ${company.defaultCurrency || 'USD'}.
Today's Date: ${format(new Date(), 'yyyy-MM-dd')}.
Existing Customers:
${customersContext || 'None'}

Return ONLY a raw JSON object (no markdown, no backticks) matching:
{
  "customer": { "id": string or null, "name": string, "companyName": string or null, "email": string or null, "phone": string or null, "isExisting": boolean },
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "currency": string,
  "items": [ { "name": string, "description": string or null, "quantity": number, "unitPrice": number, "discountRate": number, "taxRate": number, "lineTotal": number } ],
  "discountType": "PERCENTAGE" or "FIXED",
  "discountValue": number,
  "shippingAmount": number,
  "notes": string or null,
  "assumptions": string[],
  "followUpQuestions": string[]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nInstruction: ${prompt}` }] },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      },
      { timeout: 20000 },
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');
    const clean = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);
    parsed.confidenceScore = 95;
    return parsed;
  }

  private async callOpenRouterForInvoice(
    prompt: string,
    company: any,
    apiKey: string,
  ): Promise<StructuredInvoiceDraft> {
    const configuredModel = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';
    const modelsToTry = [
      configuredModel,
      'openai/gpt-4o-mini',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
    ].filter((m, i, arr) => arr.indexOf(m) === i && !m.includes('claude-3-haiku'));

    const customersContext = company.customers
      .map((c: any) => `- ID: ${c.id}, Name: ${c.name}, Company: ${c.companyName || 'N/A'}`)
      .join('\n');

    const systemPrompt = `You are InvoiceAI. Convert natural language invoicing instructions into structured JSON.
Current Company Default Currency: ${company.defaultCurrency || 'USD'}.
Today's Date: ${format(new Date(), 'yyyy-MM-dd')}.
Existing Customers:
${customersContext || 'None registered yet'}

Return ONLY a raw JSON object with:
{
  "customer": {
    "id": string or null,
    "name": string,
    "companyName": string or null,
    "email": string or null,
    "phone": string or null,
    "isExisting": boolean
  },
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "currency": string,
  "items": [
    {
      "name": string,
      "description": string or null,
      "quantity": number,
      "unitPrice": number,
      "discountRate": number,
      "taxRate": number,
      "lineTotal": number
    }
  ],
  "discountType": "PERCENTAGE" or "FIXED",
  "discountValue": number,
  "shippingAmount": number,
  "notes": string or null,
  "assumptions": string[],
  "followUpQuestions": string[]
}`;

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const body: any = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
        };

        if (model.includes('gpt-4o') || model.includes('openai')) {
          body.response_format = { type: 'json_object' };
        }

        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          body,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://invoiceai.local',
              'X-Title': 'InvoiceAI',
            },
            timeout: 25000,
          },
        );

        const content = response.data?.choices?.[0]?.message?.content?.trim();
        if (!content) continue;

        const cleanJson = content
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanJson);

        // Sanitize parsed structure
        if (!parsed.discountType || !['PERCENTAGE', 'FIXED'].includes(parsed.discountType)) {
          parsed.discountType = 'PERCENTAGE';
        }
        parsed.discountValue = Number(parsed.discountValue) || 0;
        parsed.shippingAmount = Number(parsed.shippingAmount) || 0;

        if (Array.isArray(parsed.items)) {
          parsed.items = parsed.items.map((item: any) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unitPrice) || 0;
            const disc = Number(item.discountRate) || 0;
            const tax = Number(item.taxRate) || 0;
            return {
              name: String(item.name || 'Services').trim(),
              description: item.description || null,
              quantity: qty,
              unitPrice: price,
              discountRate: disc,
              taxRate: tax,
              lineTotal: toFixed2(qty * price * (1 - disc / 100)),
            };
          });
        } else {
          parsed.items = [];
        }

        if (!Array.isArray(parsed.assumptions)) {
          parsed.assumptions = parsed.assumptions ? [String(parsed.assumptions)] : [];
        }
        if (!Array.isArray(parsed.followUpQuestions)) {
          parsed.followUpQuestions = parsed.followUpQuestions ? [String(parsed.followUpQuestions)] : [];
        }

        parsed.confidenceScore = 98;
        return parsed;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`OpenRouter model ${model} failed: ${err.message}. Trying next fallback.`);
      }
    }

    throw lastError || new Error('All OpenRouter models failed to respond');
  }

  private async callOpenAiForInvoice(prompt: string, company: any, apiKey: string): Promise<StructuredInvoiceDraft> {
    const customersContext = company.customers
      .map((c: any) => `- ID: ${c.id}, Name: ${c.name}`)
      .join('\n');

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are InvoiceAI. Convert natural language instructions into structured JSON for an invoice. Default currency: ${company.defaultCurrency || 'USD'}. Known customers: ${customersContext}. Return JSON with: customer, issueDate, dueDate, currency, items: [{name, description, quantity, unitPrice, discountRate, taxRate, lineTotal}], discountType, discountValue, shippingAmount, assumptions, followUpQuestions.`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim();
    const parsed = JSON.parse(content);
    parsed.confidenceScore = 95;
    return parsed;
  }

  // Comprehensive Dynamic NLP Parser: Converts word numbers, extracts multiple items, taxes, discounts, customer names
  private localNlpInvoiceParser(prompt: string, company: any): StructuredInvoiceDraft {
    const normalizeWordsToNumbers = (raw: string): string => {
      const wordMap: Record<string, number> = {
        zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
        sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
        twenty: 20, thirty: 30, forty: 40, fifty: 50,
        sixty: 60, seventy: 70, eighty: 80, ninety: 90,
      };

      let normalized = raw.replace(
        /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)-(one|two|three|four|five|six|seven|eight|nine)\b/gi,
        '$1 $2',
      );

      const numberPhraseRegex =
        /\b((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)\s*(?:and\s+)?)+)\b/gi;

      normalized = normalized.replace(numberPhraseRegex, (match) => {
        const words = match.toLowerCase().trim().split(/\s+/).filter((w) => w !== 'and');
        let total = 0;
        let current = 0;
        let hasNum = false;
        for (const w of words) {
          if (wordMap[w] !== undefined) {
            current += wordMap[w];
            hasNum = true;
          } else if (w === 'hundred') {
            current = (current || 1) * 100;
            hasNum = true;
          } else if (w === 'thousand') {
            total += (current || 1) * 1000;
            current = 0;
            hasNum = true;
          } else if (w === 'million') {
            total += (current || 1) * 1000000;
            current = 0;
            hasNum = true;
          }
        }
        const finalVal = total + current;
        return hasNum && finalVal > 0 ? ` ${finalVal} ` : match;
      });

      return normalized.replace(/\s+/g, ' ').trim();
    };

    const cleanTitle = (str: string): string => {
      if (!str) return '';
      let clean = str
        .replace(/^[:\s.,\-–—]+/, '')
        .replace(/[:\s.,\-–—]+$/, '')
        .replace(/^(?:and\s+also|and\s+|also\s+|plus\s+|add\s+)/i, '')
        .replace(/^(?:i\s+completed\s+(?:a\s+)?|i\s+did\s+(?:a\s+)?|completed\s+(?:a\s+)?|for\s+|to\s+|a\s+|an\s+|the\s+)/i, '')
        .replace(/\b(?:project\s+for\s+them|for\s+them)\b/gi, '')
        .trim()
        .replace(/^[:\s.,\-–—]+/, '')
        .replace(/[:\s.,\-–—]+$/, '');

      clean = clean.replace(/\s+(?:charges?|fee|cost|price)\s+(?:of|is|at)?$/i, '');

      return clean
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    const text = normalizeWordsToNumbers(prompt);
    const assumptions: string[] = [];
    const followUpQuestions: string[] = [];

    // 1. Currency Detection
    let currency = company.defaultCurrency || 'USD';
    const currencyMatch = text.match(/\b(LKR|Rs\.?|Rupees?|USD|\$|EUR|€|GBP|£|AUD|CAD|INR|SGD|AED)\b/i);
    if (currencyMatch) {
      const matchUpper = currencyMatch[0].toUpperCase();
      if (['LKR', 'RS', 'RS.', 'RUPEE', 'RUPEES'].includes(matchUpper)) currency = 'LKR';
      else if (['USD', '$'].includes(matchUpper)) currency = 'USD';
      else if (['EUR', '€'].includes(matchUpper)) currency = 'EUR';
      else if (['GBP', '£'].includes(matchUpper)) currency = 'GBP';
      else if (['INR'].includes(matchUpper)) currency = 'INR';
      else currency = matchUpper;
    } else {
      assumptions.push(`Applied default company currency: ${currency}`);
    }

    // 2. Customer Extraction
    let customerName = '';
    if (company.customers && company.customers.length > 0) {
      for (const c of company.customers) {
        if (new RegExp(`\\b${c.name}\\b`, 'i').test(text)) {
          customerName = c.name;
          break;
        }
      }
    }

    if (!customerName) {
      const custRegexes = [
        /(?:create\s+)?(?:an\s+)?(?:invoice|bill)\s+(?:for|to)\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?::|\.|\n|,|\s+for\s+|\s+with\s+|\s+due\s+|\s+\d{2,}|$)/i,
        /\b(?:bill|invoice)\s+to\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?::|\.|\n|,|\s+for\s+|\s+with\s+|\s+due\s+|\s+\d{2,}|$)/i,
        /\b(?:invoice)\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?::|\.|\n|,|\s+for\s+|\s+with\s+|\s+due\s+|\s+\d{2,}|$)/i,
      ];

      for (const r of custRegexes) {
        const m = text.match(r);
        if (m && m[1]) {
          let cand = m[1].replace(/^(a|an|the|my)\s+/i, '').replace(/[:.,]+$/, '').trim();
          const invalid = ['software', 'website', 'consulting', 'project', 'design', 'service', 'services', 'items', 'item'];
          if (cand.length > 1 && !invalid.includes(cand.toLowerCase())) {
            customerName = cand;
            break;
          }
        }
      }
    }

    if (!customerName) {
      customerName = 'Valued Customer';
      assumptions.push('Customer name not explicitly detected; please review client details.');
      followUpQuestions.push('What is the customer or company name?');
    }

    // 3. Due Date
    let dueDays = 14;
    const dueMatch = text.match(/(?:due\s+(?:date\s+)?(?:to\s+|in\s+)?|within\s+)(\d+)\s*days/i);
    if (dueMatch) {
      dueDays = parseInt(dueMatch[1], 10) || 14;
    } else if (/next week/i.test(text)) {
      dueDays = 7;
    } else if (/next month/i.test(text)) {
      dueDays = 30;
    }

    const today = new Date();
    const issueDate = format(today, 'yyyy-MM-dd');
    const dueDate = format(addDays(today, dueDays), 'yyyy-MM-dd');

    // 4. Discounts & Taxes
    let discountType: 'PERCENTAGE' | 'FIXED' = 'PERCENTAGE';
    let discountValue = 0;
    const pctDiscount = text.match(/(\d+(?:\.\d+)?)\s*%\s*discount/i);
    if (pctDiscount) {
      discountType = 'PERCENTAGE';
      discountValue = parseFloat(pctDiscount[1]);
    } else {
      const fixedDiscount = text.match(/discount\s+(?:of\s+)?(?:[A-Za-z$€£.]+\s*)?([\d,]+(?:\.\d+)?)/i);
      if (fixedDiscount) {
        discountType = 'FIXED';
        discountValue = parseFloat(fixedDiscount[1].replace(/,/g, ''));
      }
    }

    let taxRate = 0;
    const taxMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:tax|vat|gst)/i);
    if (taxMatch) {
      taxRate = parseFloat(taxMatch[1]);
    }

    // 5. Items Extraction
    const items: Array<{
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      discountRate: number;
      taxRate: number;
      lineTotal: number;
    }> = [];
    const processedPrices = new Set<number>();

    // Pattern 1: Hourly / Quantity unit items (e.g. 5 hours of software development at 4000 per hour, 2 laptops at 1000 each)
    const qtyPriceRegex =
      /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|days?|units?|pcs?|items?|licenses?)?\s*(?:of\s+)?([A-Za-z0-9\s-]+?)\s+(?:at|for|@|costing)\s*(?:[A-Za-z$€£.]+\s*)?([\d,]+(?:\.\d+)?)\s*(?:per\s+(?:hour|hr|day|unit|item|each)|each)?/gi;
    let matchQ: RegExpExecArray | null;
    while ((matchQ = qtyPriceRegex.exec(text)) !== null) {
      const qty = parseFloat(matchQ[1]) || 1;
      const rawName = cleanTitle(matchQ[2]);
      const price = parseFloat(matchQ[3].replace(/,/g, '')) || 0;
      if (price > 0 && rawName && !items.some((i) => i.name.toLowerCase() === rawName.toLowerCase())) {
        items.push({
          name: rawName,
          description: `${qty} units @ ${currency} ${price}`,
          quantity: qty,
          unitPrice: price,
          discountRate: 0,
          taxRate,
          lineTotal: toFixed2(qty * price),
        });
        processedPrices.add(price);
      }
    }

    // Pattern 2: Contextual project cost (e.g. "I completed a website development project for them. The project cost is 85000")
    const projectCostRegex =
      /(?:completed\s+(?:a\s+)?)?([A-Za-z0-9\s-]+?)(?:\s+project|\s+services?)?\.?\s+(?:the\s+)?(?:project\s+)?(?:cost|fee|price|amount)\s+(?:is|of)\s*(?:[A-Za-z$€£.]+\s*)?([\d,]+(?:\.\d+)?)/gi;
    let matchP: RegExpExecArray | null;
    while ((matchP = projectCostRegex.exec(text)) !== null) {
      const cand = matchP[1].replace(
        /^(?:create\s+(?:an\s+)?(?:invoice|bill)\s+(?:for|to)\s+[A-Za-z0-9\s&.,'-]+?\s+(?:for|to)\s+|for\s+|to\s+)/i,
        '',
      );
      const rawName = cleanTitle(cand);
      const price = parseFloat(matchP[2].replace(/,/g, '')) || 0;
      if (price > 0 && rawName.length > 1 && !processedPrices.has(price)) {
        items.push({
          name: rawName.endsWith('Project') ? rawName : `${rawName} Project`,
          description: 'Deliverables as agreed',
          quantity: 1,
          unitPrice: price,
          discountRate: 0,
          taxRate,
          lineTotal: price,
        });
        processedPrices.add(price);
      }
    }

    // Pattern 3: Explicit additions (e.g. "Add hosting charges of 10000 rupees", "Plus domain fee of 50")
    const addRegex =
      /(?:add|plus|also)\s+([A-Za-z0-9\s-]+?)(?:\s+(?:charges?|fee))?\s*(?:of|is|at|\:)\s*(?:[A-Za-z$€£.]+\s*)?([\d,]+(?:\.\d+)?)/gi;
    let matchA: RegExpExecArray | null;
    while ((matchA = addRegex.exec(text)) !== null) {
      const rawName = cleanTitle(matchA[1]);
      const price = parseFloat(matchA[2].replace(/,/g, '')) || 0;
      if (
        price > 0 &&
        rawName.length > 1 &&
        !processedPrices.has(price) &&
        !items.some((i) => i.name.toLowerCase() === rawName.toLowerCase())
      ) {
        items.push({
          name:
            rawName.toLowerCase().includes('charges') || rawName.toLowerCase().includes('fee')
              ? rawName
              : `${rawName} Charges`,
          description: 'Additional fee',
          quantity: 1,
          unitPrice: price,
          discountRate: 0,
          taxRate,
          lineTotal: price,
        });
        processedPrices.add(price);
      }
    }

    // Pattern 4: Multiple items in form "Item 750 dollars and Item2 400 dollars" or "consulting services 5000 USD"
    const multiItemRegex =
      /\b([A-Za-z\s]{3,35}?)\s+([\d,]+(?:\.\d+)?)\s*(?:dollars|rupees|usd|lkr|eur|gbp|\$|€|£)/gi;
    let matchM: RegExpExecArray | null;
    while ((matchM = multiItemRegex.exec(text)) !== null) {
      const cand = cleanTitle(matchM[1]);
      const price = parseFloat(matchM[2].replace(/,/g, '')) || 0;
      const stopWords = ['discount', 'tax', 'due', 'within', 'payment', 'total', 'subtotal', 'invoice', 'valued customer'];
      const isStopWord = stopWords.some((sw) => cand.toLowerCase().includes(sw));
      const isCustomer = customerName && cand.toLowerCase() === customerName.toLowerCase();

      if (price > 0 && cand.length > 2 && !isStopWord && !isCustomer && !processedPrices.has(price)) {
        if (!items.some((i) => i.name.toLowerCase() === cand.toLowerCase())) {
          items.push({
            name: cand,
            description: 'Deliverables as agreed',
            quantity: 1,
            unitPrice: price,
            discountRate: 0,
            taxRate,
            lineTotal: price,
          });
          processedPrices.add(price);
        }
      }
    }

    // Fallback: If no items found, look for any price and prompt for clarification
    if (items.length === 0) {
      const singlePrice = text.match(
        /(?:cost|fee|price|amount)?\s*(?:is|of)?\s*(?:[A-Za-z$€£.]+\s*)?([\d,]{2,10}(?:\.\d+)?)/i,
      );
      const priceVal = singlePrice ? parseFloat(singlePrice[1].replace(/,/g, '')) : 0;

      if (priceVal === 0) {
        followUpQuestions.push('What is the price or total amount for this invoice?');
      }

      items.push({
        name: 'Services Rendered',
        description: 'Services as agreed',
        quantity: 1,
        unitPrice: priceVal,
        discountRate: 0,
        taxRate,
        lineTotal: priceVal,
      });
    }

    return {
      customer: {
        name: customerName,
        isExisting: false,
      },
      issueDate,
      dueDate,
      currency,
      items,
      discountType,
      discountValue,
      shippingAmount: 0,
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      confidenceScore: 94,
      assumptions,
      followUpQuestions,
    };
  }

  async answerFinancialQuestion(
    companyId: string,
    query: string,
  ): Promise<{
    answer: string;
    kpis?: Record<string, any>;
    invoices?: any[];
  }> {
    const q = query.toLowerCase();

    // Fetch authorized company financial aggregates
    const [invoices, incomingInvoices, customers] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId },
        include: { customer: { select: { name: true } } },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.incomingInvoice.findMany({
        where: { companyId, status: 'APPROVED' },
      }),
      this.prisma.customer.findMany({
        where: { companyId, isArchived: false },
        include: {
          invoices: {
            where: { status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
            select: { outstandingBalance: true },
          },
        },
      }),
    ]);

    const totalRevenue = invoices
      .filter((i) => i.status === 'PAID' || i.status === 'PARTIALLY_PAID')
      .reduce((s, i) => s + Number(i.paidAmount), 0);

    const totalOutstanding = invoices
      .filter((i) => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))
      .reduce((s, i) => s + Number(i.outstandingBalance), 0);

    const totalExpenses = incomingInvoices.reduce((s, i) => s + Number(i.totalAmount), 0);

    const overdueInvoices = invoices.filter(
      (i) => i.status === 'OVERDUE' || (new Date(i.dueDate) < new Date() && Number(i.outstandingBalance) > 0),
    );

    const customersWithBalances = customers
      .map((c) => ({
        name: c.name,
        balance: c.invoices.reduce((sum, inv) => sum + Number(inv.outstandingBalance), 0),
      }))
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    // If OpenRouter key is available, generate intelligent natural language financial analysis
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    if (openRouterKey) {
      try {
        const financialContext = `
Company Financial Overview:
- Total Paid Revenue Collected: ${toFixed2(totalRevenue)}
- Total Outstanding Receivables: ${toFixed2(totalOutstanding)}
- Total Approved Expenses: ${toFixed2(totalExpenses)}
- Net Profit Margin: ${toFixed2(totalRevenue - totalExpenses)}
- Total Invoices: ${invoices.length}
- Overdue Invoices Count: ${overdueInvoices.length}
- Overdue Invoices Total Amount: ${toFixed2(overdueInvoices.reduce((s, i) => s + Number(i.outstandingBalance), 0))}
- Customers with Outstanding Balances: ${
          customersWithBalances.length > 0
            ? customersWithBalances.map((c) => `${c.name} (${toFixed2(c.balance)})`).join(', ')
            : 'None (all balances clear)'
        }
`;

        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are the AI Financial Advisor for InvoiceAI. Provide clear, concise, professional financial analysis and advice based on this verified data:\n${financialContext}\nFormat responses with clean bullet points and actionable recommendations. Do not make up numbers not present in the data.`,
              },
              { role: 'user', content: query },
            ],
            temperature: 0.3,
            max_tokens: 450,
          },
          {
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://invoiceai.local',
              'X-Title': 'InvoiceAI',
            },
            timeout: 20000,
          },
        );

        const aiAnswer = response.data?.choices?.[0]?.message?.content?.trim();
        if (aiAnswer) {
          return {
            answer: aiAnswer,
            kpis: {
              totalRevenue: toFixed2(totalRevenue),
              totalOutstanding: toFixed2(totalOutstanding),
              totalExpenses: toFixed2(totalExpenses),
              netMargin: toFixed2(totalRevenue - totalExpenses),
              overdueCount: overdueInvoices.length,
            },
            invoices: overdueInvoices.slice(0, 5),
          };
        }
      } catch (err: any) {
        this.logger.warn(`OpenRouter financial assistant call failed: ${err.message}. Falling back to rule-based metrics.`);
      }
    }

    if (q.includes('overdue')) {
      const count = overdueInvoices.length;
      const amount = overdueInvoices.reduce((s, i) => s + Number(i.outstandingBalance), 0);
      return {
        answer:
          count > 0
            ? `You have ${count} overdue invoice(s) totaling ${toFixed2(amount)}. Here are the details:`
            : 'Great news! You currently have zero overdue invoices.',
        kpis: { overdueCount: count, totalOverdueAmount: toFixed2(amount) },
        invoices: overdueInvoices.slice(0, 5),
      };
    }

    if (q.includes('outstanding') || q.includes('who owes')) {
      return {
        answer:
          customersWithBalances.length > 0
            ? `There are ${customersWithBalances.length} customer(s) with an outstanding balance. Total receivables: ${toFixed2(totalOutstanding)}.`
            : 'All customer invoices are settled. There is no outstanding balance.',
        kpis: { totalOutstanding: toFixed2(totalOutstanding), debtorCount: customersWithBalances.length },
        invoices: customersWithBalances.slice(0, 5),
      };
    }

    if (q.includes('expense') || q.includes('spent') || q.includes('hosting')) {
      return {
        answer: `Total approved expenses recorded from supplier invoices: ${toFixed2(totalExpenses)}.`,
        kpis: { totalExpenses: toFixed2(totalExpenses) },
      };
    }

    // Default summary
    return {
      answer: `Here is your current financial summary:\n• Total Invoiced Revenue Collected: ${toFixed2(totalRevenue)}\n• Outstanding Receivables: ${toFixed2(totalOutstanding)}\n• Total Supplier Expenses: ${toFixed2(totalExpenses)}\n• Net Margin: ${toFixed2(totalRevenue - totalExpenses)}`,
      kpis: {
        totalRevenue: toFixed2(totalRevenue),
        totalOutstanding: toFixed2(totalOutstanding),
        totalExpenses: toFixed2(totalExpenses),
        netMargin: toFixed2(totalRevenue - totalExpenses),
        totalInvoices: invoices.length,
      },
    };
  }
}
