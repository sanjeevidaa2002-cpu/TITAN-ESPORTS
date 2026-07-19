const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('runTransaction')) {
  content = content.replace(
    'import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs } from "firebase/firestore";',
    'import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, runTransaction } from "firebase/firestore";'
  );
  fs.writeFileSync(file, content);
}
