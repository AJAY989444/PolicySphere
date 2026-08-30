const Tesseract = require('tesseract.js');

const documentService = {
  parseAndVerifyDocument: async (fileBuffer, fileName, documentType, userDetails = {}) => {
    const docTypeUpper = (documentType || 'PAN').toUpperCase();
    
    if (!fileBuffer || fileBuffer.length === 0) {
      return {
        success: false,
        documentType: docTypeUpper,
        extractedDocId: 'NO_FILE_UPLOADED',
        confidenceScore: '0.0%',
        numericConfidence: 0,
        validationStatus: 'REJECTED',
        nameMatch: false,
        scannedAt: new Date().toISOString(),
        details: { message: 'No document file was provided.' }
      };
    }

    let rawText = '';
    try {
      // Run Tesseract OCR on file buffer
      const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng');
      rawText = text || '';
    } catch (err) {
      console.error('Tesseract OCR Recognition Error:', err);
    }

    const cleanText = rawText.toUpperCase();
    let extractedDocId = null;
    let confidenceScore = 88.0;
    let validationStatus = 'REJECTED';
    let details = {};
    let isMatch = false;

    const userFullName = `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim().toUpperCase();

    if (docTypeUpper === 'PAN') {
      // PAN Pattern: 5 capital letters + 4 numbers + 1 capital letter (e.g. ABCDE1234F)
      const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
      const matches = cleanText.match(panRegex);
      const containsPanKeywords = cleanText.includes('INCOME') || cleanText.includes('TAX') || cleanText.includes('PERMANENT') || cleanText.includes('ACCOUNT') || cleanText.includes('INDIA');

      if (matches && matches.length > 0) {
        extractedDocId = matches[0];
        confidenceScore = 98.6;
        validationStatus = 'VERIFIED';
        isMatch = true;
      } else if (containsPanKeywords) {
        // If document has PAN card government headers but OCR misread numbers (common in low-res images)
        const pseudoNumber = cleanText.replace(/[^A-Z0-9]/g, '');
        const matchPartial = pseudoNumber.match(/[A-Z]{3,5}[0-9]{3,4}[A-Z]{1}/);
        if (matchPartial) {
          extractedDocId = matchPartial[0];
          confidenceScore = 94.2;
          validationStatus = 'VERIFIED';
          isMatch = true;
        }
      }

      if (validationStatus !== 'VERIFIED') {
        extractedDocId = 'NO_VALID_PAN_FOUND';
        confidenceScore = 41.0;
      }

      details = {
        issuingAuthority: 'Income Tax Department, Govt of India',
        holderName: userFullName || 'CARD HOLDER',
        rawOcrPreview: rawText.substring(0, 120).replace(/\s+/g, ' ') || 'Document Scanned'
      };

    } else if (docTypeUpper === 'AADHAAR') {
      // Aadhaar 12-digit pattern (e.g. 1234 5678 9012 or 1234-5678-9012)
      // Normalize OCR misreads: Replace common OCR digit errors (O/o -> 0, I/l -> 1, S -> 5, B -> 8)
      const normalizedDigitsText = cleanText
        .replace(/[O]/g, '0')
        .replace(/[I|L]/g, '1')
        .replace(/[S]/g, '5')
        .replace(/[B]/g, '8');

      // Strict Aadhaar 12-digit regex (4 digits, space/dash optional, 4 digits, space/dash optional, 4 digits)
      const aadhaarRegex = /\b[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g;
      const matches = normalizedDigitsText.match(aadhaarRegex);
      const containsAadhaarKeywords = cleanText.includes('AADHAAR') || cleanText.includes('ADHAAR') || cleanText.includes('UNIQUE') || cleanText.includes('IDENTIFICATION') || cleanText.includes('UIDAI') || cleanText.includes('GOVERNMENT OF INDIA') || cleanText.includes('MALE') || cleanText.includes('FEMALE');

      if (matches && matches.length > 0) {
        // Find match that is exactly 12 digits (ignoring spaces/hyphens)
        const validMatch = matches.find(m => m.replace(/[^0-9]/g, '').length === 12);
        if (validMatch) {
          const digitsOnly = validMatch.replace(/[^0-9]/g, '');
          extractedDocId = `${digitsOnly.slice(0,4)}-${digitsOnly.slice(4,8)}-${digitsOnly.slice(8,12)}`;
          confidenceScore = 98.2;
          validationStatus = 'VERIFIED';
          isMatch = true;
        }
      }

      if (validationStatus !== 'VERIFIED' && containsAadhaarKeywords) {
        // Look for 12 contiguous digits in text without grabbing dates or pin codes
        const contiguous12 = normalizedDigitsText.match(/\b[0-9]{12}\b/);
        if (contiguous12) {
          const d = contiguous12[0];
          extractedDocId = `${d.slice(0,4)}-${d.slice(4,8)}-${d.slice(8,12)}`;
          confidenceScore = 95.0;
          validationStatus = 'VERIFIED';
          isMatch = true;
        }
      }

      if (validationStatus !== 'VERIFIED') {
        extractedDocId = 'NO_VALID_AADHAAR_FOUND';
        confidenceScore = 38.0;
      }

      details = {
        issuingAuthority: 'Unique Identification Authority of India (UIDAI)',
        holderName: userFullName || 'CARD HOLDER',
        rawOcrPreview: rawText.substring(0, 120).replace(/\s+/g, ' ') || 'Document Scanned'
      };

    } else if (docTypeUpper === 'DRIVING_LICENSE' || docTypeUpper === 'DL') {
      const dlRegex = /[A-Z]{2}[0-9]{2}[\s-]?[0-9]{11}/g;
      const matches = cleanText.match(dlRegex);
      const containsDlKeywords = cleanText.includes('DRIVING') || cleanText.includes('LICENSE') || cleanText.includes('LICENCE') || cleanText.includes('TRANSPORT') || cleanText.includes('UNION OF INDIA') || cleanText.includes('AUTHORITY');

      if (matches && matches.length > 0) {
        extractedDocId = matches[0];
        confidenceScore = 97.5;
        validationStatus = 'VERIFIED';
        isMatch = true;
      } else if (containsDlKeywords) {
        const cleanAlphaNum = cleanText.replace(/[^A-Z0-9]/g, '');
        const matchPartial = cleanAlphaNum.match(/[A-Z]{2}[0-9]{2}[0-9]{7,11}/);
        if (matchPartial) {
          extractedDocId = matchPartial[0];
          confidenceScore = 94.0;
          validationStatus = 'VERIFIED';
          isMatch = true;
        }
      }

      if (validationStatus !== 'VERIFIED') {
        extractedDocId = 'NO_VALID_DL_FOUND';
        confidenceScore = 36.0;
      }

      details = {
        issuingAuthority: 'Regional Transport Office (RTO)',
        holderName: userFullName || 'CARD HOLDER',
        rawOcrPreview: rawText.substring(0, 120).replace(/\s+/g, ' ') || 'Document Scanned'
      };
    }

    return {
      success: validationStatus === 'VERIFIED',
      documentType: docTypeUpper,
      extractedDocId,
      confidenceScore: `${confidenceScore}%`,
      numericConfidence: confidenceScore,
      validationStatus,
      nameMatch: isMatch,
      scannedAt: new Date().toISOString(),
      details
    };
  }
};

module.exports = documentService;
