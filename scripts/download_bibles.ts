import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BIBLE_SOURCES: Record<string, string> = {
  'ACF': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/ACF.json',
  'ARA': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/ARA.json',
  'ARC': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/ARC.json',
  'KJA': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/KJA.json',
  'NAA': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNAABible.xml',
  'NTLH': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNTLHBible.xml',
  'NVI': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNVI2023Bible.xml',
  'NVT': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNVTBible.xml',
  'BKJ': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishKJBible.xml',
  'NIV': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishNIVBible.xml',
  'NKJ': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishNKJBible.xml',
  'NLT': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishNLTBible.xml',
  'AMPLIFIED': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishAmplifiedBible.xml'
};

const DATA_DIR = path.join(process.cwd(), 'data', 'bible');

async function downloadBibles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const [version, url] of Object.entries(BIBLE_SOURCES)) {
    const ext = url.endsWith('.json') ? '.json' : '.xml';
    const filePath = path.join(DATA_DIR, `${version}${ext}`);
    
    console.log(`Downloading ${version} from ${url}...`);
    try {
      const response = await axios.get(url, { 
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      fs.writeFileSync(filePath, response.data);
      console.log(`Saved ${version} to ${filePath}`);
    } catch (error: any) {
      console.error(`Failed to download ${version}: ${error.message}`);
    }
  }
}

downloadBibles();
