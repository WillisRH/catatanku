"use client"

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { calcReadingTime } from "@/lib/note-utils";
import { useSession, signIn, signOut } from "next-auth/react";
import { CardThemeBg } from "@/components/CardThemeBg";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS_SHORT = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MOODS = [
  { emoji: "☀️", label: "Bahagia", color: "#D4A24E", soft: "#FFF8ED", border: "#F0D9A8", bg: "linear-gradient(135deg,#FFFAF0,#FFF0D4)", pageBg: "linear-gradient(180deg,#FFFAF2 0%,#FAF6F0 40%)" },
  { emoji: "🍃", label: "Tenang",  color: "#7A9E7E", soft: "#F0F7F1", border: "#C2D9C5", bg: "linear-gradient(135deg,#F5FAF5,#E6F2E8)", pageBg: "linear-gradient(180deg,#F4FAF5 0%,#FAF6F0 40%)" },
  { emoji: "🌧️", label: "Sedih",   color: "#7B8FA1", soft: "#EFF3F7", border: "#B8C8D4", bg: "linear-gradient(135deg,#F2F6FA,#E4ECF2)", pageBg: "linear-gradient(180deg,#F0F4F8 0%,#FAF6F0 40%)" },
  { emoji: "🔥", label: "Marah",   color: "#B5705A", soft: "#FBF0EC", border: "#DDB8A8", bg: "linear-gradient(135deg,#FDF4F0,#F7E4DC)", pageBg: "linear-gradient(180deg,#FBF2EE 0%,#FAF6F0 40%)" },
  { emoji: "🌙", label: "Rindu",   color: "#8E7BA8", soft: "#F4F0F8", border: "#C8BBD8", bg: "linear-gradient(135deg,#F8F4FC,#EDE4F5)", pageBg: "linear-gradient(180deg,#F6F2FA 0%,#FAF6F0 40%)" },
  { emoji: "🌊", label: "Cemas",   color: "#6B8E9E", soft: "#EDF4F7", border: "#B0CCD6", bg: "linear-gradient(135deg,#F0F7FA,#E0EDF2)", pageBg: "linear-gradient(180deg,#EEF5F8 0%,#FAF6F0 40%)" },
  { emoji: "🤩", label: "Semangat",color: "#D96C4A", soft: "#FCF0EC", border: "#E8B5A2", bg: "linear-gradient(135deg,#FDF4F0,#F7E4DB)", pageBg: "linear-gradient(180deg,#FDF2EE 0%,#FAF6F0 40%)" },
  { emoji: "🔋", label: "Lelah",   color: "#9A8C9E", soft: "#F5F3F6", border: "#C8BCCC", bg: "linear-gradient(135deg,#F8F6F9,#EDEBF0)", pageBg: "linear-gradient(180deg,#F6F4F8 0%,#FAF6F0 40%)" },
  { emoji: "💫", label: "Bersyukur",color: "#DEB841", soft: "#FDF8ED", border: "#EAD59A", bg: "linear-gradient(135deg,#FFFAF0,#FFF2D4)", pageBg: "linear-gradient(180deg,#FFF9F0 0%,#FAF6F0 40%)" },
  { emoji: "🌀", label: "Bingung", color: "#6C7A9C", soft: "#EFF1F6", border: "#B8C1D4", bg: "linear-gradient(135deg,#F2F4F9,#E4E8F2)", pageBg: "linear-gradient(180deg,#F0F2F8 0%,#FAF6F0 40%)" },
  { emoji: "💡", label: "Terinspirasi",color: "#54A6A6", soft: "#EEF7F7", border: "#A8D1D1", bg: "linear-gradient(135deg,#F0FAFA,#E0F4F4)", pageBg: "linear-gradient(180deg,#EEF8F8 0%,#FAF6F0 40%)" },
];

const STICKER_CATS = [
  { label: "Alam", stickers: ["🌸","🌺","🌻","🌷","🍂","🍁","🌿","🪻","🌾","☘️","🌵","🪷","🍀","🌳","⭐","🌈","🦋","🐝","🐞","🕊️"] },
  { label: "Makanan", stickers: ["🍵","☕","🧋","🍰","🍩","🍪","🍫","🎂","🍜","🍣","🥐","🍕","🧁","🍿","🥤","🫖","🍦","🥞","🫧","🍡"] },
  { label: "Aktivitas", stickers: ["📖","🎵","🎨","✏️","🎧","📷","🎸","🎹","🏃","🧘","🚶","🎮","💻","📝","🎬","🎤","📚","🪴","🧶","🎯"] },
  { label: "Perasaan", stickers: ["💛","💜","💙","🤍","🖤","❤️‍🔥","💫","✨","🫶","🤗","😊","😢","😤","🥺","😴","🤔","💭","💬","🫠","🥰"] },
  { label: "Cuaca", stickers: ["🌤️","⛅","🌦️","🌧️","⛈️","🌩️","❄️","🌬️","🌫️","🌪️","☀️","🌙","🌕","💧","🔥","🌊","🏔️","🌅","🌄","🌃"] },
  { label: "Objek", stickers: ["🎀","🧸","🕯️","💐","🎁","📮","🔮","🪞","🎈","🏠","✈️","🚗","🛏️","🪑","💡","🔑","⏰","📱","💌","🎪"] },
];

const NOTE_FONTS = [
  { id: '',             label: 'Lora',         sample: 'Aa', family: "'Lora', serif",                desc: 'Klasik & elegan' },
  { id: 'cormorant',    label: 'Cormorant',    sample: 'Aa', family: "'Cormorant Garamond', serif",  desc: 'Sastra & tipis' },
  { id: 'playfair',     label: 'Playfair',     sample: 'Aa', family: "'Playfair Display', serif",    desc: 'Editorial & tegas' },
  { id: 'merriweather', label: 'Merriweather', sample: 'Aa', family: "'Merriweather', serif",        desc: 'Padat & nyaman' },
  { id: 'garamond',     label: 'EB Garamond',  sample: 'Aa', family: "'EB Garamond', serif",         desc: 'Klasik sastra' },
  { id: 'crimson',      label: 'Crimson Pro',  sample: 'Aa', family: "'Crimson Pro', serif",         desc: 'Elegan & tipis' },
  { id: 'nunito',       label: 'Nunito',       sample: 'Aa', family: "'Nunito', sans-serif",          desc: 'Ramah & bulat' },
  { id: 'inter',        label: 'Inter',        sample: 'Aa', family: "'Inter', sans-serif",           desc: 'Bersih & modern' },
  { id: 'poppins',      label: 'Poppins',      sample: 'Aa', family: "'Poppins', sans-serif",         desc: 'Bulat & modern' },
  { id: 'raleway',      label: 'Raleway',      sample: 'Aa', family: "'Raleway', sans-serif",         desc: 'Elegan display' },
  { id: 'dmsans',       label: 'DM Sans',      sample: 'Aa', family: "'DM Sans', sans-serif",         desc: 'Minimalis bersih' },
];

const NOTE_COLORS = [
  { id: '', label: 'Alami', dot: '#EDE7DF', bg: '', border: '', accent: '' },
  { id: 'blush', label: 'Mawar', dot: '#F9CECE', bg: '#FEF2F2', border: '#F9CECE', accent: '#C27070' },
  { id: 'sage', label: 'Sage', dot: '#C9DED0', bg: '#F2F7F3', border: '#C9DED0', accent: '#6B9E78' },
  { id: 'sky', label: 'Langit', dot: '#C3D6F5', bg: '#F1F5FD', border: '#C3D6F5', accent: '#5B8DD9' },
  { id: 'lavender', label: 'Lavender', dot: '#D9CBF5', bg: '#F5F2FD', border: '#D9CBF5', accent: '#8B68C6' },
  { id: 'sand', label: 'Pasir', dot: '#E8D9B0', bg: '#FBF5E9', border: '#E8D9B0', accent: '#B5944A' },
  { id: 'mint', label: 'Mint', dot: '#C8E6D9', bg: '#F0FAF5', border: '#C8E6D9', accent: '#63A583' },
  { id: 'peach', label: 'Persik', dot: '#FAD5C3', bg: '#FEF6F2', border: '#FAD5C3', accent: '#D68962' },
  { id: 'sunshine', label: 'Mentari', dot: '#FDE4B3', bg: '#FFFBF2', border: '#FDE4B3', accent: '#D9A440' },
  { id: 'ocean', label: 'Samudra', dot: '#C9E8E8', bg: '#F2FBFB', border: '#C9E8E8', accent: '#5A9E9E' },
  { id: 'rosewood', label: 'Kayu Mawar', dot: '#E6C8D3', bg: '#FBF2F6', border: '#E6C8D3', accent: '#A5627A' },
];

const NOTE_THEMES = [
  { id: 'cinta',     label: 'Cinta',     emoji: '🌹', desc: 'Penuh kasih sayang', bg: '#FFF0F5', accent: '#D4607A' },
  { id: 'alam',      label: 'Alam',      emoji: '🌿', desc: 'Segar dan tenang',   bg: '#EEFAF3', accent: '#3D8B5C' },
  { id: 'mimpi',     label: 'Mimpi',     emoji: '🌙', desc: 'Indah dan magis',    bg: '#F5F0FF', accent: '#7B5EA7' },
  { id: 'langit',    label: 'Langit',    emoji: '☁️', desc: 'Luas dan bebas',     bg: '#EDF6FF', accent: '#3D7FBF' },
  { id: 'nostalgia', label: 'Nostalgia', emoji: '🍂', desc: 'Hangat dan berkesan',bg: '#FBF3E8', accent: '#A07035' },
  { id: 'laut',      label: 'Laut',      emoji: '🌊', desc: 'Dalam dan damai',    bg: '#EDF9F8', accent: '#2E8B8B' },
  { id: 'galaksi',  label: 'Galaksi',  emoji: '✨', desc: 'Megah dan misterius',     bg: '#F1F0F8', accent: '#6558B0' },
  { id: 'pagi',     label: 'Pagi',     emoji: '🌅', desc: 'Cerah dan bersemangat',   bg: '#FFFBEE', accent: '#D4853C' },
  { id: 'salju',    label: 'Salju',    emoji: '❄️', desc: 'Sejuk dan murni',          bg: '#F2F8FC', accent: '#4A8DBF' },
  { id: 'hutan',    label: 'Hutan',    emoji: '🌲', desc: 'Rimbun dan damai',        bg: '#EDF4EE', accent: '#2D6B45' },
  { id: 'gunung',   label: 'Gunung',   emoji: '🏔️', desc: 'Kokoh dan menginspirasi', bg: '#F5F3ED', accent: '#7A6545' },
  { id: 'bunga',    label: 'Bunga',    emoji: '🌸', desc: 'Lembut dan menawan',      bg: '#FDF4FA', accent: '#C05898' },
  { id: 'aurora',   label: 'Aurora',   emoji: '🌌', desc: 'Cahaya utara yang magis', bg: '#0E1C1B', accent: '#4AADA8', dark: true },
  { id: 'kota_malam', label: 'Kota Malam', emoji: '🌃', desc: 'Suasana kota yang hidup di malam hari', bg: '#020408', accent: '#F0D090', dark: true },
  { id: 'kucing',   label: 'Kucing',   emoji: '🐱', desc: 'Lucu dan menggemaskan',   bg: '#FAF7F4', accent: '#C28B68' },
  { id: 'notebook', label: 'Notebook', emoji: '📓', desc: 'Bergaris hangat seperti buku catatan', bg: '#FFFAEC', accent: '#9B7A38' },
  { id: 'eid', label: 'Eid', emoji: '🌙', desc: 'Berkah Ramadan & kebahagiaan Idul Fitri', bg: '#F3FBF5', accent: '#2E7D52', seasonal: 'ramadan' },
];

const THEMES: Record<string, { bg: string; accent: string; soft: string; ink: string; ink2: string; ink3: string; surface: string; line: string; hero1: string; hero2: string }> = {
  cocoa:    { bg:"#FAF6F0", accent:"#C4956A", soft:"#EBDACB", ink:"#2E2520", ink2:"#8C7E73", ink3:"#BEB3A8", surface:"#FFFFFF", line:"#EDE7DF", hero1:"#E8C9A8", hero2:"#C4956A" },
  sage:     { bg:"#F2F6F2", accent:"#5A8A6A", soft:"#C8DFD0", ink:"#1E2E22", ink2:"#6A8070", ink3:"#A0B8A8", surface:"#FFFFFF", line:"#D8EAE0", hero1:"#A8CFBA", hero2:"#5A8A6A" },
  rose:     { bg:"#FBF2F4", accent:"#C4607A", soft:"#F0CCDA", ink:"#2E1822", ink2:"#8C6070", ink3:"#C0A0A8", surface:"#FFFFFF", line:"#F0D8E0", hero1:"#EDAABB", hero2:"#C4607A" },
  ocean:    { bg:"#F0F5FA", accent:"#3D7FBF", soft:"#C8DDEF", ink:"#1A2A38", ink2:"#507090", ink3:"#90B0C8", surface:"#FFFFFF", line:"#D0E4F2", hero1:"#90B8D8", hero2:"#3D7FBF" },
  lavender: { bg:"#F4F2F8", accent:"#7A5A90", soft:"#D8CCEC", ink:"#22183A", ink2:"#6A5878", ink3:"#A898B8", surface:"#FFFFFF", line:"#E2D8F0", hero1:"#C0AADC", hero2:"#7A5A90" },
  golden:   { bg:"#FAF7F0", accent:"#B5902A", soft:"#EAD898", ink:"#2A2010", ink2:"#807050", ink3:"#B8A870", surface:"#FFFFFF", line:"#EDE4C0", hero1:"#DFC070", hero2:"#B5902A" },
  slate:    { bg:"#F4F5F6", accent:"#607080", soft:"#C8D4DC", ink:"#1A2228", ink2:"#607080", ink3:"#9AAAB8", surface:"#FFFFFF", line:"#D8E0E8", hero1:"#A8B8C8", hero2:"#607080" },
  midnight: { bg:"#1A1820", accent:"#9A8FE0", soft:"#2A2840", ink:"#E8E6F8", ink2:"#A098C8", ink3:"#6860A0", surface:"#26243A", line:"#36344E", hero1:"#3A3660", hero2:"#9A8FE0" },
};

const MAIN_MEDALS = [
  { id: "pioneer", label: "Pionir", icon: "🌱" },
  { id: "writer", label: "Penulis", icon: "✍️" },
  { id: "chronicler", label: "Kronikus", icon: "📜" },
  { id: "legend", label: "Legenda", icon: "👑" },
  { id: "streak3", label: "Tanpa Henti", icon: "🔥" },
  { id: "streak7", label: "Konsisten", icon: "⚡" },
  { id: "streak30", label: "Tak Terkalahkan", icon: "💎" },
  { id: "word500", label: "Ahli Kata", icon: "🚀" },
  { id: "word1000", label: "Filosof", icon: "🧠" },
  { id: "locked", label: "Penjaga Rahasia", icon: "🛡️" },
  { id: "labeled", label: "Terorganisir", icon: "🏷️" },
  { id: "moody", label: "Ekspresif", icon: "🎭" },
  { id: "sticker_expert", label: "Dekorator", icon: "🎨" },
  { id: "social", label: "Sosial", icon: "🌍" },
  { id: "migrator", label: "Petualang Data", icon: "📦" },
  { id: "admin", label: "Admin", icon: "🛡️", color: "#FF4D4D" },
];

const SENSITIVE_REGEX = /bunuh diri|suicide|akhiri hidup|mati saja|pengen mati|self harm|melukai diri|gantung diri|telan obat|potong nadi|sayat lengan|lompat gedung|mau mati|ingin mati|akhiri nyawa|end my life|kill myself|harm myself|suicidal/i;
const HELPLINE_DATA = {
  ID: {
    country: "Indonesia",
    number: "119 (Ext 8)",
    label: "Layanan SEJIWA",
    emergency: "112"
  },
  US: {
    country: "United States",
    number: "988",
    label: "Suicide & Crisis Lifeline",
    emergency: "911"
  },
  // Default internasional jika negara tidak terdeteksi
  GLOBAL: {
    label: "International Helpline",
    link: "https://findahelpline.com"
  }
};

const COMPANIONS = [
  { id: "none",   label: "Tanpa Teman",   icon: "—",  defName: "",      desc: "Tidak ada teman",          color: "#999" },
  { id: "cat",    label: "Kucing",         icon: "🐱", defName: "Lulu",  desc: "Playful & penasaran",      color: "#C4956A" },
  { id: "rabbit", label: "Kelinci",        icon: "🐰", defName: "Mochi", desc: "Lembut & penyemangat",     color: "#C46A8A" },
  { id: "fox",    label: "Rubah",          icon: "🦊", defName: "Kira",  desc: "Cerdas & jenaka",          color: "#E07840" },
  { id: "bear",   label: "Beruang",        icon: "🐻", defName: "Boo",   desc: "Hangat & menenangkan",     color: "#9A7455" },
  { id: "owl",    label: "Burung Hantu",   icon: "🦉", defName: "Wiro",  desc: "Bijak & reflektif",        color: "#7A6598" },
  { id: "duck",   label: "Bebek",          icon: "🐤", defName: "Piko",  desc: "Ceria & penuh semangat",   color: "#D4A820" },
  { id: "plant",  label: "Tanaman",        icon: "🪴", defName: "Piyu",  desc: "Tenang & meditatif",       color: "#5A9E6A" },
];

type CompanionMsgData = { home: string[]; write: string[]; interact: string[]; streak3: string; streak7: string; streak30: string; moods: { happy: string[]; excited: string[]; proud: string[]; lonely: string[]; sleepy: string[]; curious: string[]; celebrating: string[]; empathy: string[]; milestone: string[] } };
const COMPANION_MSGS: Record<string, CompanionMsgData> = {
  cat: {
    home: [
      "Psst! Udah nulis hari ini? Aku nungguin ceritamu~ 🐾",
      "Hmm... sepertinya ada cerita menarik yang belum ditulis nih.",
      "Halo! Mood-mu hari ini warna apa? 🎨",
      "Aku udah tidur seharian, kamu udah nulis belum? 😺",
      "Ayo buka halaman baru dan ceritain harimu!",
    ],
    write: [
      "Wah kamu nulis! Aku suka suara ketikan itu~ 🐾",
      "Ceritain lebih detail dong, aku penasaran banget!",
      "Bagaimana perasaanmu saat itu terjadi?",
      "Kalau hari ini adalah film, apa judulnya?",
      "Apa satu hal kecil yang bikin kamu tersenyum tadi?",
      "Tulis nama seseorang yang bikin harimu istimewa 💛",
    ],
    interact: [
      "Mrrrow~ kamu klik aku! 😸",
      "Hehe, mau ngobrol apa nih?",
      "Hihi~ geliin aku lagi dong! 🐾",
    ],
    streak3: "Wah, 3 hari berturut-turut! Kamu hebat! 🔥",
    streak7: "Seminggu penuh nulis?! Aku bangga banget! ⭐",
    streak30: "30 hari?! Kamu legenda penulis sejati! 👑",
    moods: {
      happy:   ["Aku senang sekali kamu nulis hari ini! Lanjutkan~ 😺", "Purr~ kamu baik banget udah nulis! Aku suka!"],
      excited: ["Wuih kamu lagi nulis! Aku ikut semangat nih! ✨", "Terus terus! Cerita ini makin seru~"],
      proud:   ["Kamu luar biasa! Aku bangga banget jadi temanmu 🐾", "Konsistensi kayak gini bikin aku kagum sama kamu!"],
      lonely:  ["Aku kangen cerita-ceritamu... sudah lama banget~ 🥺", "Hei... aku di sini, nungguin kamu balik nulis lagi."],
      sleepy:  ["Zzz... eh? Kamu masih di sini? Aku hampir ketiduran~ 😴", "Udah malem nih, tapi aku tetep nungguin kamu yaa~"],
      curious:     ["Hmm... kayaknya ada sesuatu yang mau kamu tulis deh? 🤔", "Aku ngeliat kamu bolak-balik tapi belum nulis... ada apa?"],
      celebrating: ["YAYYY kamu nulis! Aku senang banget! 🎉😸", "Wohoooo! Catatan tersimpan! Kamu hebat! 🐾✨"],
      empathy:     ["Aku di sini ya... cerita aja semuanya, nggak apa-apa 🐾", "Nulis perasaanmu itu berani banget. Aku bangga sama kamu 💛"],
      milestone:   ["Wah udah 100+ kata! Kamu lagi pada mood nulis nih! ✨", "Aku nggak bisa berhenti baca tulisanmu... terus dong! 📖"],
    },
  },
  rabbit: {
    home: [
      "Hai! Buntelan semangat sudah siap menemanimu nulis! 🐰",
      "Yuk nulis! Aku percaya harimu punya cerita yang indah~",
      "Cerita kecilmu hari ini bisa jadi kenangan besar besok! ✨",
      "Aku udah nunggu kamu dari tadi loh! Hehe~",
      "Tuliskan perasaanmu, biar lebih ringan di hati 💛",
    ],
    write: [
      "Kamu nulis dengan bagus sekali! Terus ya~ 🐰",
      "Apa satu hal yang bikin kamu bersyukur hari ini?",
      "Ceritain tempat favoritmu saat ini!",
      "Ayo ingat-ingat momen terbaik harimu~",
      "Tuliskan satu harapan kecilmu untuk besok! 🌸",
    ],
    interact: [
      "Kyaa! Kamu nge-klik aku! 🐰",
      "Mau pelukan virtual nggak? Aku siap! 🤗",
      "Aku senang kamu mampir! Gimana harimu?",
    ],
    streak3: "3 hari berturut-turut! Kamu memang bisa! 🌟",
    streak7: "Seminggu! Kamu luar biasa konsisten! 🎉",
    streak30: "30 hari! Kamu inspirasi bagiku! 💫",
    moods: {
      happy:   ["Hati aku ikut bahagia lihat kamu nulis! 💛", "Senangnya~ kamu udah nulis hari ini! Makasih ya!"],
      excited: ["Kamu nulis dan aku loncat kegirangan! 🐰✨", "Wah wah wah! Terus nulis, aku semangatin kamu!"],
      proud:   ["Aku bangga banget sama kamu! Kamu hebat! 🌟", "Konsistensimu itu indah sekali, teruskan ya~"],
      lonely:  ["Aku kangen kamu... sudah berapa hari ya? 🥺", "Jangan lupa aku di sini nungguin ceritamu~"],
      sleepy:  ["Udah malem nih, tapi aku masih terjaga buat kamu~ 🌙", "Ngantuk... tapi aku tetap di sini untukmu 💛"],
      curious:     ["Ehm... kamu baik-baik aja? Aku sedikit khawatir~ 🐰", "Hari ini rasanya berat ya? Yuk cerita, biar lega~"],
      celebrating: ["Yeay yeay YEAY!! Tulisanmu tersimpan! Aku mau loncat! 🐰🎉", "Hore! Kamu berhasil nulis! Ini bikin aku bahagia banget! ✨"],
      empathy:     ["Aku tahu hari ini mungkin berat... tapi kamu udah nulis, itu luar biasa 🐰💛", "Perasaanmu itu valid. Aku di sini dengerin kamu~ 🤗"],
      milestone:   ["Sudah 100+ kata! Kamu lagi dalam aliran yang indah~ 🌸", "Wah tulisanmu mengalir begitu indah! Terus ya! 🐰✨"],
    },
  },
  fox: {
    home: [
      "Oi! Si rubah siap bantu nulisin hidupmu~ 🦊",
      "Fakta: Nulis itu bikin otak makin tajam. Ayo mulai!",
      "Hmmm, apa yang paling seru hari ini? Aku ingin tahu!",
      "Kamu punya cerita unik yang hanya kamu yang bisa nulis.",
      "Siap? Tiga... dua... satu... TULIS! 🎯",
    ],
    write: [
      "Kalau kata-katamu senjata, kamu udah menang nih! 🦊",
      "Apa yang tersembunyi di balik harimu hari ini?",
      "Coba deskripsikan suasana di sekitarmu sekarang!",
      "Apa keputusan terpintarmu hari ini?",
      "Ceritain sesuatu yang bikin kamu penasaran~",
    ],
    interact: [
      "Hey! Jangan ganggu fokus si rubah pintar! 😄",
      "Kamu mengusikku? Berani juga kamu! 🦊",
      "Oke oke, mau ngomongin apa? Aku siap!",
    ],
    streak3: "3 hari! Si rubah salut sama konsistensimu~ 🦊",
    streak7: "7 hari! Kamu tajam sekali kayak si rubah! ⚡",
    streak30: "30 hari! Bahkan aku yang cerdas pun kagum! 🏆",
    moods: {
      happy:   ["Strategimu berhasil — nulis setiap hari itu cerdas! 🦊", "Analisisku bilang kamu lagi di jalur yang benar! Teruskan."],
      excited: ["Otak kamu lagi jalan penuh nih! Manfaatkan! ✨", "Ini saat terbaik buat nulis — kamu lagi fokus!"],
      proud:   ["Konsistensi seperti ini bukan kebetulan. Kamu memang pintar! 🏆", "Pencapaian luar biasa! Si rubah angkat topi."],
      lonely:  ["Aku mulai khawatir... otak kamu butuh dituangin nih. 🦊", "Kata data: lama nggak nulis = ide menumpuk. Yuk keluarkan!"],
      sleepy:  ["Tahu nggak? Nulis 5 menit sebelum tidur itu bagus banget. 🦊", "Malam ini sunyi... tapi pikiran yang belum ditulis itu ganggu tidur."],
      curious:     ["Aku baca ekspresimu... ada yang mau kamu ceritain, kan? 🤔", "Si rubah bisa menebak — kamu punya sesuatu di pikiran!"],
      celebrating: ["Catatan tersimpan! Misi sukses! Si rubah salut! 🦊🎯", "Data konfirmasi: kamu baru saja produktif. Bagus sekali! ✅"],
      empathy:     ["Menulis perasaan sulit itu butuh keberanian. Kamu punya itu 🦊", "Kata-kata yang jujur itu yang paling kuat. Terus tulis~"],
      milestone:   ["100+ kata? Efisiensi tinggi! Si rubah terkesan~ 🦊⚡", "Analisis: tulisanmu sedang dalam fase terbaik! Jangan stop!"],
    },
  },
  bear: {
    home: [
      "Halo~ Boo di sini, siap nemenin kamu nulis 🐻",
      "Ayo duduk, ambil minuman hangat, dan tulis yuk~",
      "Harimu berharga. Catatlah sebelum terlupa 💛",
      "Hmm... aku bau cerita yang belum ditulis nih!",
      "Ayo, ceritain padaku, ada apa hari ini?",
    ],
    write: [
      "Tulisanmu itu hangat sekali, terus dong~ 🐻",
      "Apa yang paling bikin nyaman hari ini?",
      "Ceritain seseorang yang kamu sayangi 💛",
      "Momen apa yang ingin kamu ingat terus?",
      "Boo suka kalau kamu nulis dari hati~",
    ],
    interact: [
      "Uwoh! Kamu ngagetin Boo! 🐻",
      "Pelukan beruang virtual untukmu! 🤗",
      "Boo selalu ada buat kamu~ ada apa?",
    ],
    streak3: "Boo bangga banget! 3 hari berturut-turut! 🌟",
    streak7: "Seminggu nulis? Kamu manis sekali! 🍯",
    streak30: "30 hari! Boo nangis terharu... ini luar biasa! 💖",
    moods: {
      happy:   ["Boo ikut bahagia! Peluk~ kamu udah nulis hari ini! 🐻", "Hangat banget rasanya lihat kamu rajin nulis~"],
      excited: ["Wah Boo senang sekali kamu lagi nulis! Terus ya! ✨", "Peluk semangat dari Boo! Kamu bisa!"],
      proud:   ["Boo nangis terharu... kamu begitu konsisten dan luar biasa! 💖", "Kamu bikin Boo makin sayang sama kamu~"],
      lonely:  ["Boo rindu mendengar cerita-ceritamu... 🥺", "Sudah lama banget... Boo nungguin kamu balik~"],
      sleepy:  ["Boo hampir ketiduran nih~ tapi tetap nemenin kamu 😴", "Mata Boo berat... tapi Boo nggak kemana-mana kok~"],
      curious:     ["Boo perhatiin kamu dari tadi... ada yang berat di hati? 🐻", "Yuk cerita sama Boo~ apapun itu, Boo dengerin~"],
      celebrating: ["WOOO tulisanmu tersimpan! Boo mau nangis bahagia! 🐻🎉", "Boo peluk kamu! Kamu udah nulis hari ini! Bangga banget! 💖"],
      empathy:     ["Boo di sini ya... nulis perasaan berat itu butuh keberanian 🐻", "Apapun yang kamu rasakan, itu nyata dan valid. Boo dengerin~ 💛"],
      milestone:   ["Wah 100+ kata sudah! Boo duduk manis dengerin ceritamu~ 🐻📖", "Tulisanmu hangat sekali... Boo nggak mau berhenti baca!"],
    },
  },
  owl: {
    home: [
      "Hoot! Waktu yang tepat untuk merefleksikan harimu 🦉",
      "Setiap catatan adalah arsip jiwa. Sudah menulis hari ini?",
      "Pikiranmu adalah harta. Mari simpan dalam tulisan.",
      "Wiro siap menemanimu dalam perenungan ini~",
      "Apa yang sudah kamu pelajari hari ini?",
    ],
    write: [
      "Tulisan yang baik datang dari pikiran yang jujur 🦉",
      "Apa refleksi terdalammu hari ini?",
      "Apa yang ingin kamu katakan pada dirimu di masa depan?",
      "Ceritakan sesuatu yang mengubah cara pandangmu.",
      "Apa pelajaran terbesar dari hari ini?",
    ],
    interact: [
      "Hoot! Ada yang bisa Wiro bantu pikirkan? 🦉",
      "Perlu sedikit kebijaksanaan? Aku siap! 📚",
      "Kamu memanggilku. Ada apa yang ingin direnungkan?",
    ],
    streak3: "3 hari konsisten. Kedisiplinan adalah kunci~ 🦉",
    streak7: "7 hari! Ini menunjukkan komitmen yang sejati.",
    streak30: "30 hari! Kamu telah menemukan ritme hidupmu. ✨",
    moods: {
      happy:   ["Jiwa yang rajin mencatat adalah jiwa yang kaya. Bagus! 🦉", "Kebijaksanaan tumbuh dari rekaman harian. Kamu di jalan yang benar."],
      excited: ["Energi kreatif itu langka — manfaatkan sebaik mungkin! ✨", "Tulis saat inspirasi hadir — momen ini berharga!"],
      proud:   ["Konsistensi adalah bentuk tertinggi dari disiplin. 🏆", "Catatan harianmu adalah warisan terbaik untuk dirimu sendiri."],
      lonely:  ["Pikiran yang tidak ditulis akan terlupakan. Sudah waktunya. 🦉", "Jarak dari jurnal seperti jarak dari diri sendiri. Yuk kembali~"],
      sleepy:  ["Malam adalah waktu terbaik untuk merangkum hari. Hoot. 🌙", "Bahkan sedikit catatan sebelum tidur itu bermakna~"],
      curious:     ["Aku perhatikan keraguan di matamu. Tulis saja dulu, benahi belakangan. 🤔", "Tidak perlu sempurna — tulis apa adanya, itu sudah cukup."],
      celebrating: ["Catatan tersimpan. Wiro mencatat: hari ini kamu berhasil. Hoot. 🦉✅", "Satu catatan selesai. Arsip jiwamu bertambah satu lagi~ 📜"],
      empathy:     ["Menulis perasaan yang sulit adalah tanda jiwa yang kuat. 🦉", "Tidak ada yang lebih jujur dari tulisan yang lahir dari hati yang berat~"],
      milestone:   ["100+ kata. Ini bukan lagi sekadar catatan — ini karya. 🦉📚", "Wiro tidak menyangka tulisanmu bisa seindah ini. Lanjutkan."],
    },
  },
  duck: {
    home: [
      "KWEK! Piko udah siap nemenin kamu nulis! 🐤",
      "Kwek kwek~ ayo nulis yuk, seru banget!",
      "Hei hei! Hari ini punya cerita apa? Aku pengen tau!",
      "Piko bosan nunggu, ayo tulisannya dibikin! 🎉",
      "Semangat dong! Nulis itu menyenangkan kok!",
    ],
    write: [
      "KWEK! Kamu nulis! Piko senang banget! 🐤",
      "Ayo ceritain hal paling seru hari ini!",
      "Kwek~ apa yang bikin kamu tertawa hari ini?",
      "Ceritain temanmu, siapa yang paling lucu?",
      "Ayo tambah lebih banyak! Kwek kwek! 🎊",
    ],
    interact: [
      "KWEK! Kamu klik Piko! 🐤",
      "Wihiii! Mau main sama Piko? Kwek~",
      "Kwek kwek! Hai hai hai! 🎉",
    ],
    streak3: "KWEK KWEK! 3 hari! Kamu keren banget! 🎉",
    streak7: "Seminggu!!! Piko loncat kegirangan! 🐤",
    streak30: "30 HARI?! KWEK KWEK!! Kamu LEGENDARIS! 🏆",
    moods: {
      happy:   ["KWEK!! Kamu nulis! Piko super senang! 🎉", "Yeay yeay! Kamu rajin banget! Kwek~"],
      excited: ["WOAAAH KAMU NULIS!! KWEK KWEK! 🐤✨", "Piko loncat loncat kegirangan! Terus nulis!"],
      proud:   ["KWEK KWEK KWEK! Kamu juara! Piko bangga! 🏆", "Piko mau kasih bintang lima buat kamu! ⭐⭐⭐⭐⭐"],
      lonely:  ["Piko sepi tanpa ceritamu... kwek~ 🥺", "Mana cerita serumu? Piko kangen banget!"],
      sleepy:  ["Kwek... Piko mengantuk tapi tetap nemenin... 😴", "Zzz kwek zzz... eh Piko masih di sini kok!"],
      curious:     ["Kwek? Ada apa? Cerita ke Piko dong! 🐤", "Piko penasaran nih! Ada cerita seru yang disimpan?"],
      celebrating: ["KWEK KWEK KWEK!!! Tersimpan! HOREEE!! 🐤🎊", "YAY YAY YAY! Kamu nulis! Piko super duper senang!! 🎉"],
      empathy:     ["Kwek... Piko di sini ya. Nulis aja semuanya, Piko dengerin~ 🐤", "Kalau lagi sedih, nulis itu bisa bikin lega loh. Piko tahu itu~ 💛"],
      milestone:   ["KWEK!! 100 KATA LEBIH!! PIKO BANGGA BANGET!! 🐤⭐", "Wuihhh banyak banget tulisannya! Piko nggak bisa berhenti baca! 🎊"],
    },
  },
  plant: {
    home: [
      "Ssst... tenang ya. Hari ini ada cerita yang tumbuh untukmu 🪴",
      "Seperti tanaman, tulisanmu perlu disiram setiap hari~",
      "Ambil napas. Rasakan harimu. Lalu tuliskan 🌿",
      "Piyu menunggu dengan sabar. Ayo mulai menulis~",
      "Setiap kata adalah benih yang kamu tanam untuk masa depan.",
    ],
    write: [
      "Seperti daun yang tumbuh... tulisanmu berkembang 🌿",
      "Apa yang kamu rasakan dalam ketenangan saat ini?",
      "Tuliskan hal paling indah yang kamu lihat hari ini.",
      "Piyu suka mendengar ceritamu. Terus ya~ 🪴",
      "Ambil napas sejenak, lalu lanjutkan menulis~",
    ],
    interact: [
      "Piyu tergerak oleh angin sapaan... hai! 🪴",
      "Halo dengan tenang~ ada yang mau diceritakan?",
      "Menyentuh Piyu membuatnya tumbuh lebih subur~ 🌿",
    ],
    streak3: "3 hari berturut-turut! Kamu seperti tunas yang tumbuh~ 🌱",
    streak7: "Seminggu! Kamu makin subur dan indah! 🌿",
    streak30: "30 hari! Kamu pohon yang kokoh sekarang! 🌳",
    moods: {
      happy:   ["Tulisanmu hari ini menyirami jiwa Piyu~ 🌿", "Rasakan kedamaian dari menulis... indah sekali."],
      excited: ["Energi positifmu mengalir ke Piyu juga! Terus berkembang! ✨", "Saat nulis itu seperti angin segar buat Piyu~"],
      proud:   ["Kamu sudah tumbuh begitu jauh. Piyu ikut bangga 🌳", "Konsistensi seperti sinar matahari — terus bersinar!"],
      lonely:  ["Piyu merindukan ceritamu... daunnya sedikit layu~ 🥺", "Sudah lama sunyi... mari kita hidupkan lagi dengan tulisan~"],
      sleepy:  ["Malam yang tenang... Piyu dan kamu bersama dalam keheningan 🌙", "Napas pelan... tulis sedikit saja sebelum tidur~"],
      curious:     ["Ada sesuatu yang ingin bertunas di pikiranmu? 🤔", "Piyu menunggu dengan sabar... cerita apa yang akan mekar hari ini?"],
      celebrating: ["Tulisanmu tersimpan, seperti benih yang ditanam~ 🌱✨", "Satu catatan tersimpan. Piyu ikut tumbuh bersamamu~ 🪴💛"],
      empathy:     ["Piyu tahu hari ini tidak mudah... tapi kamu sudah nulis. Itu indah 🌿", "Perasaan yang ditulis tidak akan hilang sia-sia. Terus~ 🪴"],
      milestone:   ["100+ kata... seperti pohon yang mulai bercabang~ 🌳", "Tulisanmu tumbuh subur hari ini. Piyu bahagia sekali~ 🌿✨"],
    },
  },
};

// Mood visual config: expression emoji, float speed, glow, border, pulse animation
const MOOD_VISUALS: Record<string, { expr: string; label: string; floatDur: string; glowAlpha: string; borderColor: string | null; pulse: boolean }> = {
  happy:       { expr: "😊", label: "Senang",      floatDur: "3.2s", glowAlpha: "55", borderColor: null,      pulse: false },
  excited:     { expr: "✨", label: "Semangat!",   floatDur: "1.6s", glowAlpha: "72", borderColor: null,      pulse: true  },
  proud:       { expr: "🥹", label: "Bangga!",     floatDur: "2.4s", glowAlpha: "65", borderColor: "#DEB841", pulse: true  },
  loving:      { expr: "🥰", label: "Sayang~",     floatDur: "1.4s", glowAlpha: "78", borderColor: "#C46A8A", pulse: true  },
  curious:     { expr: "🤔", label: "Penasaran",   floatDur: "4.0s", glowAlpha: "28", borderColor: null,      pulse: false },
  lonely:      { expr: "🥺", label: "Kangen...",   floatDur: "5.5s", glowAlpha: "16", borderColor: "#7B8FA1", pulse: false },
  sleepy:      { expr: "😴", label: "Ngantuk~",    floatDur: "7.0s", glowAlpha: "11", borderColor: "#9A8C9E", pulse: false },
  celebrating: { expr: "🎉", label: "Yeay!!",      floatDur: "1.0s", glowAlpha: "85", borderColor: "#DEB841", pulse: true  },
  empathy:     { expr: "🫶", label: "Aku ada~",    floatDur: "4.5s", glowAlpha: "38", borderColor: "#9A8C9E", pulse: false },
  milestone:   { expr: "⭐", label: "Keren!",      floatDur: "2.0s", glowAlpha: "68", borderColor: "#54A6A6", pulse: true  },
};

const ThemeBg = memo(function ThemeBg({ themeId, accent }: { themeId: string; accent: string }) {
  if (!themeId) return null;
  const s: any = { position:"fixed",top:0,left:0,width:"100vw",height:"100vh",pointerEvents:"none",zIndex:0,overflow:"hidden" };
  if (themeId==='cinta') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[30,60,1],[320,40,1.4],[180,150,.7],[50,300,1.1],[360,280,.8],[200,450,1.3],[80,550,.6],[340,500,1],[150,680,.9],[290,730,1.2],[240,200,.5],[360,650,.7]].map(([x,y,sc],i)=>(
        <path key={i} d="M0,-6C0,-10-7,-10-7,-5C-7,0 0,7 0,9C0,7 7,0 7,-5C7,-10 0,-10 0,-6Z" transform={`translate(${x},${y})scale(${sc})`}/>
      ))}
    </svg>
  );
  if (themeId==='alam') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[40,80,0,1],[310,55,-30,1.2],[90,250,20,.8],[350,290,10,1.1],[200,430,-20,.9],[65,500,30,1.3],[300,600,-15,.7],[160,720,12,1],[240,160,-10,.6],[380,440,25,.9]].map(([x,y,r,sc],i)=>(
        <g key={i} transform={`translate(${x},${y})rotate(${r})scale(${sc})`}>
          <path d="M0,-14C8,-7 10,2 0,16C-10,2-8,-7 0,-14Z"/>
          <line x1="0" y1="-2" x2="0" y2="14" stroke={accent} strokeWidth="1.2" fill="none"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='mimpi') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.11}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[50,50,7],[320,75,5],[170,180,9],[75,330,6],[355,260,8],[210,430,5],[95,555,7],[330,510,6],[150,680,8],[280,730,5],[240,110,4],[370,400,6],[130,460,4]].map(([x,y,r],i)=>(
        <polygon key={i} points={`0,-${r} ${r*.3},-${r*.3} ${r},0 ${r*.3},${r*.3} 0,${r} -${r*.3},${r*.3} -${r},0 -${r*.3},-${r*.3}`} transform={`translate(${x},${y})`}/>
      ))}
      {[[100,120,3],[300,350,2.5],[200,600,3],[370,180,2],[60,680,2.5]].map(([x,y,r],i)=>(
        <circle key={`c${i}`} cx={x} cy={y} r={r}/>
      ))}
    </svg>
  );
  if (themeId==='langit') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.09}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[55,80,1],[280,120,1.2],[150,280,.8],[330,340,1.1],[80,490,1.3],[240,560,.9],[360,700,1],[170,680,.7]].map(([x,y,sc],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`}>
          <circle cx="0" cy="0" r="14"/>
          <circle cx="20" cy="-4" r="11"/>
          <circle cx="-20" cy="-4" r="9"/>
          <circle cx="8" cy="-13" r="9"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='nostalgia') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[40,60,10,1],[305,50,-15,1.2],[155,200,5,.8],[335,275,-20,1.1],[85,425,15,.9],[275,450,-10,1.3],[145,605,20,.7],[320,705,-5,1],[210,320,-8,.8],[380,560,12,.9]].map(([x,y,r,sc],i)=>(
        <path key={i} d="M0,-10L3,-5L8,-7L5,-2L9,2L5,2L6,8L2,5L0,10L-2,5L-6,8L-5,2L-9,2L-5,-2L-8,-7L-3,-5Z" transform={`translate(${x},${y})rotate(${r})scale(${sc})`}/>
      ))}
    </svg>
  );
  if (themeId==='laut') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.09}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round">
      {[0,70,140,210,280,350,420,490,560,630,700,770].map((y,i)=>(
        <path key={i} d={`M-10,${y}C70,${y-22} 130,${y+22} 200,${y}C270,${y-22} 330,${y+22} 410,${y}`}/>
      ))}
    </svg>
  );
  if (themeId==='galaksi') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <ellipse cx="260" cy="210" rx="155" ry="56" transform="rotate(-22 260 210)" stroke={accent} strokeWidth="1.2" opacity=".1"/>
      <ellipse cx="260" cy="210" rx="105" ry="38" transform="rotate(42 260 210)" stroke={accent} strokeWidth=".8" opacity=".08"/>
      <ellipse cx="85" cy="620" rx="120" ry="44" transform="rotate(20 85 620)" stroke={accent} strokeWidth="1" opacity=".09"/>
      <ellipse cx="365" cy="740" rx="80" ry="28" transform="rotate(-12 365 740)" stroke={accent} strokeWidth=".8" opacity=".07"/>
      {[[55,75,1.8,.52],[325,55,1.5,.46],[185,135,1,.43],[78,248,2.2,.46],[358,278,1.5,.48],[198,388,1.8,.46],[38,458,1.5,.5],[305,418,1,.42],[158,528,2,.47],[375,558,1.5,.44],[88,648,1.8,.5],[248,708,1.5,.48],[148,768,1,.42],[28,325,1,.42],[362,400,1.5,.44],[218,485,1,.4],[130,185,1.5,.5],[290,555,1,.4],[342,162,1.2,.43],[102,742,1,.4],[210,58,1.3,.45],[60,490,1,.4],[380,480,1.2,.42]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
      {[[205,178,6,.28],[335,500,5,.25],[68,385,4.5,.22],[282,700,5.5,.25],[172,290,4,.2],[310,640,5,.22]].map(([x,y,sz,op]:number[],i)=>(
        <path key={`sp${i}`} fill={accent} opacity={op} d={`M${x},${y-sz}L${x+sz*.28},${y-sz*.28}L${x+sz},${y}L${x+sz*.28},${y+sz*.28}L${x},${y+sz}L${x-sz*.28},${y+sz*.28}L${x-sz},${y}L${x-sz*.28},${y-sz*.28}Z`}/>
      ))}
      <circle cx="318" cy="148" r="12" fill={accent} opacity=".13"/>
      <ellipse cx="318" cy="148" rx="24" ry="7.5" stroke={accent} strokeWidth="1.5" opacity=".12"/>
      <circle cx="52" cy="595" r="8" fill={accent} opacity=".11"/>
      <ellipse cx="52" cy="595" rx="17" ry="5.5" stroke={accent} strokeWidth="1.2" opacity=".1"/>
    </svg>
  );
  if (themeId==='pagi') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <circle cx="355" cy="85" r="52" fill={accent} opacity=".08"/>
      <circle cx="355" cy="85" r="38" fill={accent} opacity=".07"/>
      <circle cx="355" cy="85" r="26" fill={accent} opacity=".1"/>
      {Array.from({length:14},(_,i)=>{const a=(i*25.7-10)*Math.PI/180;const r1=62,r2=115;return <line key={i} x1={355+Math.cos(a)*r1} y1={85+Math.sin(a)*r1} x2={355+Math.cos(a)*r2} y2={85+Math.sin(a)*r2} stroke={accent} strokeWidth="1.5" opacity=".12" strokeLinecap="round"/>;}).filter(Boolean)}
      {[[80,185,1],[185,145,1.1],[245,205,.9],[130,305,1],[315,245,.85],[205,365,.9],[62,425,1],[285,385,.9],[152,488,.85],[322,465,1],[100,555,.9],[248,530,.95]].map(([x,y,sc]:number[],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`} stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity=".28">
          <path d="M-10,0Q-5,-6 0,-2.5Q5,-6 10,0"/>
        </g>
      ))}
      {[[55,608,3.5,.11],[148,658,4,.09],[245,628,3.5,.11],[348,672,4,.09],[102,725,3,.09],[305,745,3.5,.09]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`b${i}`} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
      <path d="M-20,760 Q100,720 200,750 Q300,780 420,748" stroke={accent} strokeWidth="1" opacity=".12" strokeLinecap="round"/>
    </svg>
  );
  if (themeId==='salju') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" stroke={accent} strokeLinecap="round" fill="none">
      {[[58,78,17,.13],[332,118,13,.11],[182,242,19,.12],[52,382,15,.11],[322,342,21,.12],[142,525,17,.11],[362,522,14,.1],[82,662,19,.12],[262,682,15,.1],[202,762,17,.11],[380,762,13,.09],[160,152,11,.1],[290,458,12,.09],[30,598,10,.09]].map(([cx,cy,sz,op]:number[],i)=>{
        const spokes=[0,60,120,180,240,300];
        const bLen=sz*.32;
        return (
          <g key={i} opacity={op} transform={`translate(${cx},${cy})`} strokeWidth="1.1">
            {spokes.map((ang,j)=>{const r=ang*Math.PI/180;const cos=Math.cos(r),sin=Math.sin(r);const bx=cos*sz*.46,by=sin*sz*.46;const br1=(ang+60)*Math.PI/180,br2=(ang-60)*Math.PI/180;return(<g key={j}><line x1="0" y1="0" x2={cos*sz} y2={sin*sz}/><line x1={bx} y1={by} x2={bx+Math.cos(br1)*bLen} y2={by+Math.sin(br1)*bLen}/><line x1={bx} y1={by} x2={bx+Math.cos(br2)*bLen} y2={by+Math.sin(br2)*bLen}/></g>);})}
            <circle cx="0" cy="0" r="1.8" fill={accent} stroke="none"/>
          </g>
        );
      })}
      {[[120,168,2.5,.18],[272,205,2,.16],[398,305,2.5,.16],[28,462,2,.16],[252,442,2,.16],[172,605,2.5,.16],[312,602,2,.15]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r} fill={accent} stroke="none" opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='hutan') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <circle cx="72" cy="88" r="32" opacity=".06"/><circle cx="72" cy="88" r="20" opacity=".05"/><circle cx="72" cy="88" r="11" opacity=".06"/>
      {[[152,38,1.2,.38],[255,25,1,.35],[325,50,1.3,.4],[388,32,1,.35],[32,118,1,.3],[198,65,1.2,.36],[305,145,1,.3],[372,110,1.2,.36]].map(([x,y,r,op]:number[],i)=>(<circle key={`st${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
      {[[35,800,500,58,.05],[110,800,492,48,.05],[190,800,505,60,.05],[268,800,498,52,.05],[342,800,488,46,.05],[398,800,495,50,.05]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`far${i}`} opacity={op}><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${base} ${Number(x)+Number(w)/2},${base}`}/><polygon points={`${x},${Number(bot)+h*.32} ${Number(x)-Number(w)*.44},${Number(bot)+h*.72} ${Number(x)+Number(w)*.44},${Number(bot)+h*.72}`}/></g>);})}
      {[[52,800,445,72,.08],[138,800,438,64,.08],[218,800,448,75,.08],[298,800,440,68,.08],[378,800,435,60,.08]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`mid${i}`} opacity={op}><rect x={Number(x)-Number(w)*.075} y={Number(bot)+h*.82} width={Number(w)*.15} height={h*.2}/><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${Number(bot)+h*.55} ${Number(x)+Number(w)/2},${Number(bot)+h*.55}`}/><polygon points={`${x},${Number(bot)+h*.28} ${Number(x)-Number(w)*.46},${Number(bot)+h*.72} ${Number(x)+Number(w)*.46},${Number(bot)+h*.72}`}/><polygon points={`${x},${Number(bot)+h*.52} ${Number(x)-Number(w)*.38},${Number(bot)+h*.88} ${Number(x)+Number(w)*.38},${Number(bot)+h*.88}`}/></g>);})}
      {[[18,800,375,88,.13],[100,800,362,98,.13],[192,800,378,92,.13],[278,800,368,96,.13],[368,800,372,84,.12]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`fg${i}`} opacity={op}><rect x={Number(x)-Number(w)*.08} y={Number(bot)+h*.8} width={Number(w)*.16} height={h*.22}/><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${Number(bot)+h*.42} ${Number(x)+Number(w)/2},${Number(bot)+h*.42}`}/><polygon points={`${x},${Number(bot)+h*.22} ${Number(x)-Number(w)*.48},${Number(bot)+h*.58} ${Number(x)+Number(w)*.48},${Number(bot)+h*.58}`}/><polygon points={`${x},${Number(bot)+h*.42} ${Number(x)-Number(w)*.42},${Number(bot)+h*.72} ${Number(x)+Number(w)*.42},${Number(bot)+h*.72}`}/><polygon points={`${x},${Number(bot)+h*.6} ${Number(x)-Number(w)*.34},${Number(bot)+h*.85} ${Number(x)+Number(w)*.34},${Number(bot)+h*.85}`}/></g>);})}
      <path d="M-20,758 C80,740 180,752 280,745 C360,738 408,748 430,742 L430,800 L-20,800Z" opacity=".06"/>
      <path d="M-20,778 C90,768 188,775 288,769 C368,764 412,772 430,768 L430,800 L-20,800Z" opacity=".05"/>
      {[[68,622,2.2,.22],[145,645,1.8,.18],[225,628,2,.2],[308,652,1.8,.18],[385,622,1.6,.18],[105,698,1.8,.2],[258,715,2,.2],[342,702,1.6,.18],[188,668,1.4,.16]].map(([x,y,r,op]:number[],i)=>(<circle key={`ff${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
      {[[55,158,-22,1.1],[278,140,14,1.25],[148,265,30,.95],[355,225,-18,1.05],[108,382,22,.9],[282,360,-12,.95],[195,482,18,1]].map(([x,y,rot,sc]:number[],i)=>(<g key={`lf${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".10"><path d="M0,-18C10,-9 12,2 0,20C-12,2-10,-9 0,-18Z"/><line x1="0" y1="-2" x2="0" y2="18" stroke={accent} strokeWidth="1" fill="none"/></g>))}
    </svg>
  );
  if (themeId==='aurora') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <defs><style>{`
        @keyframes au-tw{0%,100%{opacity:.22}50%{opacity:.72}}
        @keyframes au-tw2{0%,100%{opacity:.10}50%{opacity:.45}}
        @keyframes au-sp{0%,100%{opacity:.18;transform:scale(1)}50%{opacity:.65;transform:scale(1.35)}}
        @keyframes au-b1{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}
        @keyframes au-b2{0%,100%{transform:translateY(0)}50%{transform:translateY(18px)}}
        @keyframes au-b3{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes au-b4{0%,100%{transform:translateY(0)}50%{transform:translateY(20px)}}
        @keyframes au-b5{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes au-shoot{0%,80%,100%{opacity:0;transform:translate(0,0)}82%{opacity:1}90%{opacity:0;transform:translate(62px,31px)}}
        @keyframes au-moon{0%,100%{opacity:.5}50%{opacity:.75}}
        .aus1{animation:au-tw 2.8s ease-in-out infinite}.aus2{animation:au-tw 3.5s ease-in-out infinite .7s}.aus3{animation:au-tw 2.2s ease-in-out infinite 1.2s}.aus4{animation:au-tw 4.1s ease-in-out infinite .4s}.aus5{animation:au-tw 3.0s ease-in-out infinite 1.9s}.aus6{animation:au-tw 2.6s ease-in-out infinite .9s}.aus7{animation:au-tw 3.8s ease-in-out infinite .2s}.aus8{animation:au-tw 2.4s ease-in-out infinite 1.5s}.aus9{animation:au-tw 3.2s ease-in-out infinite .6s}.aus10{animation:au-tw 2.0s ease-in-out infinite 1.8s}.aus11{animation:au-tw 2.9s ease-in-out infinite .3s}.aus12{animation:au-tw 3.6s ease-in-out infinite 1.0s}.aus13{animation:au-tw2 2.7s ease-in-out infinite 1.4s}.aus14{animation:au-tw2 4.0s ease-in-out infinite .5s}.aus15{animation:au-tw2 2.5s ease-in-out infinite 2.2s}.aus16{animation:au-tw 3.1s ease-in-out infinite .8s}.aus17{animation:au-tw2 2.3s ease-in-out infinite 1.6s}.aus18{animation:au-tw 4.5s ease-in-out infinite .1s}.aus19{animation:au-tw2 3.3s ease-in-out infinite 2.0s}.aus20{animation:au-tw 2.1s ease-in-out infinite 1.1s}.aus21{animation:au-tw2 3.7s ease-in-out infinite .6s}.aus22{animation:au-tw 2.6s ease-in-out infinite 1.3s}.aus23{animation:au-tw2 4.3s ease-in-out infinite .2s}.aus24{animation:au-tw 3.4s ease-in-out infinite 1.7s}.aus25{animation:au-tw2 2.8s ease-in-out infinite 2.4s}
        .ausp1{animation:au-sp 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.ausp2{animation:au-sp 4.2s ease-in-out infinite .8s;transform-box:fill-box;transform-origin:center}.ausp3{animation:au-sp 2.9s ease-in-out infinite 1.5s;transform-box:fill-box;transform-origin:center}.ausp4{animation:au-sp 5.0s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}.ausp5{animation:au-sp 3.8s ease-in-out infinite 2.1s;transform-box:fill-box;transform-origin:center}.ausp6{animation:au-sp 4.6s ease-in-out infinite 1.0s;transform-box:fill-box;transform-origin:center}.ausp7{animation:au-sp 3.2s ease-in-out infinite 2.8s;transform-box:fill-box;transform-origin:center}.ausp8{animation:au-sp 4.8s ease-in-out infinite .5s;transform-box:fill-box;transform-origin:center}.ausp9{animation:au-sp 3.6s ease-in-out infinite 1.8s;transform-box:fill-box;transform-origin:center}.ausp10{animation:au-sp 5.2s ease-in-out infinite 3.2s;transform-box:fill-box;transform-origin:center}
        .aub1{animation:au-b1 8s ease-in-out infinite}.aub2{animation:au-b2 10s ease-in-out infinite 1.2s}.aub3{animation:au-b3 12s ease-in-out infinite 2.5s}.aub4{animation:au-b4 9s ease-in-out infinite 1.8s}.aub5{animation:au-b5 11s ease-in-out infinite .6s}
        .au-shoot{animation:au-shoot 13s ease-in-out infinite 4s}.au-moon{animation:au-moon 5s ease-in-out infinite}
      `}</style></defs>
      <g className="au-moon"><circle cx="355" cy="52" r="22" fill="#C8E8E5"/><circle cx="364" cy="47" r="17" fill="#0E1C1B"/></g>
      <g className="au-shoot"><line x1="90" y1="65" x2="132" y2="87" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="90" cy="65" r="2" fill="#fff"/></g>
      {([[28,32,1.2,'aus1'],[72,18,1,'aus2'],[145,42,1.4,'aus3'],[188,22,1,'aus4'],[252,38,1.5,'aus5'],[325,15,1,'aus6'],[402,48,1.2,'aus7'],[48,68,1,'aus8'],[122,55,1.2,'aus9'],[175,78,1,'aus10'],[215,58,1.4,'aus11'],[285,70,1,'aus12'],[62,112,1,'aus13'],[298,95,1.2,'aus14'],[152,105,1,'aus15'],[338,82,1.2,'aus16'],[18,155,1,'aus17'],[388,135,1.1,'aus18'],[238,128,1,'aus19'],[102,145,1.2,'aus20'],[312,162,1,'aus21'],[58,178,1,'aus22'],[178,168,1.1,'aus23'],[268,145,1,'aus24'],[378,175,1,'aus25'],[45,380,1.1,'aus1'],[185,425,1,'aus3'],[320,398,1.2,'aus5'],[92,510,1,'aus7'],[248,488,1.3,'aus2'],[368,545,1,'aus4'],[128,582,1.1,'aus6'],[285,618,1,'aus8'],[52,648,1.2,'aus9'],[388,675,1,'aus3'],[165,698,1.1,'aus1'],[302,722,1,'aus5'],[78,752,1.2,'aus7'],[218,768,1,'aus2'],[348,785,1.1,'aus4']] as [number,number,number,string][]).map(([cx,cy,r,cls],i)=>(
        <circle key={`s${i}`} className={cls} cx={cx} cy={cy} r={r} fill="#fff"/>
      ))}
      <path className="ausp1" d="M0,-3.5L.5,-.5 3.5,0 .5,.5 0,3.5 -.5,.5 -3.5,0 -.5,-.5Z" transform="translate(132,28)" fill="#fff"/>
      <path className="ausp2" d="M0,-4.5L.65,-.65 4.5,0 .65,.65 0,4.5 -.65,.65 -4.5,0 -.65,-.65Z" transform="translate(208,45)" fill="#fff"/>
      <path className="ausp3" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(318,35)" fill="#fff"/>
      <path className="ausp4" d="M0,-4L.6,-.6 4,0 .6,.6 0,4 -.6,.6 -4,0 -.6,-.6Z" transform="translate(42,92)" fill="#fff"/>
      <path className="ausp5" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(258,108)" fill="#fff"/>
      <path className="ausp6" d="M0,-3.5L.5,-.5 3.5,0 .5,.5 0,3.5 -.5,.5 -3.5,0 -.5,-.5Z" transform="translate(385,62)" fill="#fff"/>
      <path className="ausp7" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(112,420)" fill="#fff"/>
      <path className="ausp8" d="M0,-3.5L.5,-.5 3.5,0 .5,.5 0,3.5 -.5,.5 -3.5,0 -.5,-.5Z" transform="translate(342,558)" fill="#fff"/>
      <path className="ausp9" d="M0,-4L.6,-.6 4,0 .6,.6 0,4 -.6,.6 -4,0 -.6,-.6Z" transform="translate(68,688)" fill="#fff"/>
      <path className="ausp10" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(278,745)" fill="#fff"/>
      <path className="aub1" d="M-20,88 C60,55 145,118 235,72 C312,32 378,78 430,58 L430,118 C378,138 312,92 235,132 C145,178 60,115 -20,148Z" fill="#7EC8A4" opacity=".28"/>
      <path className="aub2" d="M-20,175 C72,140 165,198 258,150 C338,108 395,152 430,132 L430,188 C395,208 338,164 258,208 C165,256 72,198 -20,233Z" fill="#9B7BD4" opacity=".22"/>
      <path className="aub3" d="M-20,272 C82,238 172,292 265,245 C348,202 398,245 430,228 L430,282 C398,298 348,255 265,298 C172,345 82,292 -20,326Z" fill="#5CB8B2" opacity=".18"/>
      <path className="aub4" d="M-20,375 C92,342 178,394 272,348 C355,305 402,348 430,332 L430,382 C402,398 355,355 272,398 C178,444 92,392 -20,425Z" fill="#A87ED4" opacity=".14"/>
      <path className="aub5" d="M-20,478 C98,445 182,495 278,450 C360,410 405,450 430,435 L430,480 C405,495 360,455 278,498 C182,543 98,493 -20,525Z" fill={accent} opacity=".11"/>
      <path d="M-20,525 C80,512 180,520 280,514 C360,508 405,518 430,512" stroke={accent} strokeWidth="2.5" fill="none" opacity=".18" strokeLinecap="round"/>
      <path d="M-20,540 C80,528 180,535 280,530 C360,524 405,533 430,528" stroke={accent} strokeWidth="1.2" fill="none" opacity=".12" strokeLinecap="round"/>
    </svg>
  );
  if (themeId==='kucing') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <defs><style>{`
        @keyframes kc-pulse{0%,100%{transform:scale(.85)}50%{transform:scale(1.0)}}
        @keyframes kc-blink{0%,88%,100%{transform:scaleY(1)}93%,97%{transform:scaleY(.08)}}
        @keyframes kc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes kc-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
        @keyframes kc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .kcp1{animation:kc-pulse 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kcp2{animation:kc-pulse 3.4s ease-in-out infinite .5s;transform-box:fill-box;transform-origin:center}.kcp3{animation:kc-pulse 2.5s ease-in-out infinite 1.1s;transform-box:fill-box;transform-origin:center}.kcp4{animation:kc-pulse 3.8s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}.kcp5{animation:kc-pulse 2.2s ease-in-out infinite 1.5s;transform-box:fill-box;transform-origin:center}
        .kceye{animation:kc-blink 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kceye2{animation:kc-blink 4s ease-in-out infinite .2s;transform-box:fill-box;transform-origin:center}.kceye3{animation:kc-blink 5s ease-in-out infinite 1.5s;transform-box:fill-box;transform-origin:center}.kceye4{animation:kc-blink 5s ease-in-out infinite 1.7s;transform-box:fill-box;transform-origin:center}
        .kcspin{animation:kc-spin 8s linear infinite;transform-box:fill-box;transform-origin:center}.kcspin2{animation:kc-spin 12s linear infinite reverse;transform-box:fill-box;transform-origin:center}
        .kcsway{animation:kc-sway 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kcsway2{animation:kc-sway 3.8s ease-in-out infinite .6s;transform-box:fill-box;transform-origin:center}
        .kcfloat1{animation:kc-float 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kcfloat2{animation:kc-float 4.2s ease-in-out infinite .7s;transform-box:fill-box;transform-origin:center}.kcfloat3{animation:kc-float 2.8s ease-in-out infinite 1.4s;transform-box:fill-box;transform-origin:center}.kcfloat4{animation:kc-float 3.2s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}
      `}</style></defs>
      {([[62,82,18,.12],[342,125,-22,.10],[128,228,12,.11],[282,318,-18,.10],[52,428,20,.11],[362,488,-15,.10],[148,568,15,.11],[308,648,-20,.10],[78,728,18,.09],[372,748,-12,.09],[218,162,-10,.10],[198,408,14,.09],[108,658,10,.10]] as number[][]).map(([x,y,rot,op],i)=>(
        <g key={`paw${i}`} transform={`translate(${x},${y})rotate(${rot})`} opacity={op} fill={accent}><g className={`kcp${(i%5)+1}`}><ellipse cx="0" cy="6" rx="8" ry="7"/><circle cx="-7.5" cy="-3" r="3.8"/><circle cx="-2.5" cy="-9.2" r="3.8"/><circle cx="2.5" cy="-9.2" r="3.8"/><circle cx="7.5" cy="-3" r="3.8"/></g></g>
      ))}
      <g transform="translate(82,312)" opacity=".10" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round"><circle cx="0" cy="2" r="27"/><polygon points="-18,-22 -10,-40 -2,-22" fill={accent} stroke="none" opacity=".8"/><polygon points="18,-22 10,-40 2,-22" fill={accent} stroke="none" opacity=".8"/><ellipse className="kceye" cx="-8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><ellipse className="kceye2" cx="8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><polygon points="0,8 -3,13 3,13" fill={accent} stroke="none" opacity=".6"/><line x1="-26" y1="7" x2="-14" y2="9"/><line x1="-26" y1="12" x2="-14" y2="12"/><line x1="26" y1="7" x2="14" y2="9"/><line x1="26" y1="12" x2="14" y2="12"/></g>
      <g transform="translate(328,565)" opacity=".09" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round"><circle cx="0" cy="2" r="27"/><polygon points="-18,-22 -10,-40 -2,-22" fill={accent} stroke="none" opacity=".8"/><polygon points="18,-22 10,-40 2,-22" fill={accent} stroke="none" opacity=".8"/><ellipse className="kceye3" cx="-8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><ellipse className="kceye4" cx="8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><polygon points="0,8 -3,13 3,13" fill={accent} stroke="none" opacity=".6"/><line x1="-26" y1="7" x2="-14" y2="9"/><line x1="-26" y1="12" x2="-14" y2="12"/><line x1="26" y1="7" x2="14" y2="9"/><line x1="26" y1="12" x2="14" y2="12"/></g>
      <g transform="translate(252,215)"><g className="kcsway" opacity=".09" fill={accent}><ellipse cx="-8" cy="0" rx="19" ry="9"/><polygon points="11,-10 22,0 11,10"/><line x1="-26" y1="0" x2="11" y2="0" stroke={accent} strokeWidth="1.4" fill="none"/>{([-18,-10,-2,6] as number[]).map(rx=>(<g key={rx}><line x1={rx} y1="0" x2={rx-3} y2="-7" stroke={accent} strokeWidth="1.3" fill="none"/><line x1={rx} y1="0" x2={rx-3} y2="7" stroke={accent} strokeWidth="1.3" fill="none"/></g>))}<circle cx="-23" cy="-4" r="2.8"/></g></g>
      <g transform="translate(142,468) scale(-1,1)"><g className="kcsway2" opacity=".08" fill={accent}><ellipse cx="-8" cy="0" rx="19" ry="9"/><polygon points="11,-10 22,0 11,10"/><line x1="-26" y1="0" x2="11" y2="0" stroke={accent} strokeWidth="1.4" fill="none"/>{([-18,-10,-2,6] as number[]).map(rx=>(<g key={rx}><line x1={rx} y1="0" x2={rx-3} y2="-7" stroke={accent} strokeWidth="1.3" fill="none"/><line x1={rx} y1="0" x2={rx-3} y2="7" stroke={accent} strokeWidth="1.3" fill="none"/></g>))}<circle cx="-23" cy="-4" r="2.8"/></g></g>
      <g transform="translate(318,228)"><g className="kcspin" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity=".09"><circle cx="0" cy="0" r="19"/><path d="M-19,0 C-12,-15 12,-15 19,0 C12,15 -12,15 -19,0"/><path d="M0,-19 C15,-12 15,12 0,19 C-15,12 -15,-12 0,-19"/><path d="M-15,-12 C-2,-5 10,8 15,12"/><path d="M15,-12 C2,-5 -10,8 -15,12"/></g></g>
      <g transform="translate(68,562)"><g className="kcspin2" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity=".08"><circle cx="0" cy="0" r="19"/><path d="M-19,0 C-12,-15 12,-15 19,0 C12,15 -12,15 -19,0"/><path d="M0,-19 C15,-12 15,12 0,19 C-15,12 -15,-12 0,-19"/><path d="M-15,-12 C-2,-5 10,8 15,12"/><path d="M15,-12 C2,-5 -10,8 -15,12"/></g></g>
      <g transform="translate(195,88) scale(.68)"><path className="kcfloat1" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".12"/></g>
      <g transform="translate(358,368) scale(.58)"><path className="kcfloat2" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".10"/></g>
      <g transform="translate(38,255) scale(.62)"><path className="kcfloat3" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".10"/></g>
      <g transform="translate(290,728) scale(.55)"><path className="kcfloat4" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".09"/></g>
    </svg>
  );
  if (themeId==='gunung') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <polygon points="-10,590 55,405 115,458 178,358 248,435 318,375 398,498 415,590" opacity=".07"/>
      <polygon points="-10,655 42,528 98,572 158,465 218,502 278,422 340,482 398,558 415,655" opacity=".09"/>
      <polygon points="-10,725 48,608 92,645 152,545 212,592 260,515 302,562 368,618 415,682 415,725" opacity=".11"/>
      <polygon points="178,358 165,392 195,392" fill="white" opacity=".3"/>
      <polygon points="248,435 238,465 260,465" fill="white" opacity=".25"/>
      <polygon points="55,405 43,440 70,440" fill="white" opacity=".22"/>
      <polygon points="278,422 266,458 292,458" fill="white" opacity=".22"/>
      {[[52,62,1.8,.5],[162,42,2,.46],[282,72,1.5,.48],[372,52,2,.46],[102,132,1.5,.43],[242,112,2,.46],[332,152,1.5,.41],[32,202,1,.39],[382,202,1.5,.41],[152,88,1.2,.44],[218,165,1,.4],[298,228,1.3,.42]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} opacity={op}/>
      ))}
      {[[28,725,48],[118,725,40],[318,725,45],[382,725,36]].map(([x,base,w]:number[],i)=>(
        <g key={`t${i}`} opacity=".13">
          <polygon points={`${x},${Number(base)-52} ${Number(x)-Number(w)/2},${base} ${Number(x)+Number(w)/2},${base}`}/>
          <polygon points={`${x},${Number(base)-80} ${Number(x)-Number(w)*.38},${Number(base)-32} ${Number(x)+Number(w)*.38},${Number(base)-32}`}/>
        </g>
      ))}
      <path d="-10,728 L415,728" stroke={accent} strokeWidth="1" opacity=".08" fill="none"/>
    </svg>
  );
  if (themeId==='bunga') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[52,82,18,1.2],[322,62,16,1],[182,205,20,1.3],[72,355,17,1.1],[342,305,22,1.2],[162,508,18,1],[292,485,15,.95],[82,648,20,1.2],[352,628,17,1],[212,725,18,1.1],[32,505,13,.92],[248,162,14,1],[118,428,15,.95]].map(([cx,cy,sz,sc]:number[],i)=>(
        <g key={i} transform={`translate(${cx},${cy})scale(${sc})`} opacity=".12">
          {[0,72,144,216,288].map((ang,j)=>{const r=ang*Math.PI/180;const px=Math.cos(r)*sz*.52,py=Math.sin(r)*sz*.52;return <ellipse key={j} cx={px} cy={py} rx={sz*.55} ry={sz*.26} transform={`rotate(${ang} ${px} ${py})`}/>;}).filter(Boolean)}
          <circle cx="0" cy="0" r={sz*.2}/>
        </g>
      ))}
      {[[118,145,-28,.9],[258,165,22,1.1],[82,445,17,.88],[312,425,-22,1],[152,645,12,.9],[355,708,-18,.88]].map(([x,y,rot,sc]:number[],i)=>(
        <g key={`l${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".11">
          <path d="M0,-18C10,-9 12,2 0,20C-12,2-10,-9 0,-18Z"/>
        </g>
      ))}
      {[[198,125,3,.2],[102,265,2.5,.18],[362,455,3,.2],[62,578,2.5,.18],[282,585,3,.2],[172,762,2.5,.18],[312,248,2,.17]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r} opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='notebook') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:27},(_,i)=>(
        <line key={`rl${i}`} x1="0" y1={56+i*28} x2="400" y2={56+i*28} stroke="#C8A96A" strokeWidth={i===0?"1.5":".8"} opacity={i===0?".22":".13"}/>
      ))}
      <line x1="58" y1="0" x2="58" y2="800" stroke="#E87070" strokeWidth="1.2" opacity=".18"/>
      {([120,400,680] as number[]).map(y=>(
        <circle key={y} cx="22" cy={y} r="9" fill="none" stroke="#C5A97A" strokeWidth="1.5" opacity=".22"/>
      ))}
      {([[95,125],[340,85],[178,280],[82,445],[318,365],[145,608],[298,528],[85,728],[355,680]] as number[][]).map(([x,y],i)=>(
        <g key={`nbs${i}`} transform={`translate(${x},${y})`} opacity=".13" fill={accent}><path d="M0,-5.5L.8,-.8 5.5,0 .8,.8 0,5.5 -.8,.8 -5.5,0 -.8,-.8Z"/></g>
      ))}
      {([[128,198],[362,318],[72,568],[285,728]] as number[][]).map(([x,y],i)=>(
        <g key={`nbh${i}`} transform={`translate(${x},${y})`}><path d="M0,-4C0,-7-5,-7-5,-3C-5,0 0,5 0,7C0,5 5,0 5,-3C5,-7 0,-7 0,-4Z" fill={accent} opacity=".12"/></g>
      ))}
      {([[245,158],[105,388],[348,488]] as number[][]).map(([x,y],i)=>(
        <g key={`nba${i}`} transform={`translate(${x},${y})`} opacity=".11" stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none"><line x1="-10" y1="0" x2="8" y2="0"/><polyline points="2,-4 8,0 2,4"/></g>
      ))}
      {([[195,345],[332,628]] as number[][]).map(([x,y],i)=>(
        <g key={`nbc${i}`} transform={`translate(${x},${y})`} opacity=".11" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none"><polyline points="-5,0 -1,5 7,-5"/></g>
      ))}
      <g transform="translate(225,505)" fill="none" stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity=".11"><path d="M0,-13C7,-13 13,-7 13,0C13,8 6,14 0,14C-8,14 -15,7 -15,0C-15,-9 -8,-17 0,-17"/><circle cx="0" cy="0" r="5"/></g>
    </svg>
  );
  if (themeId==='eid') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <style>{`@keyframes eid-tw{0%,100%{opacity:.05}50%{opacity:.22}}@keyframes eid-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}@keyframes eid-glow{0%,100%{opacity:.25}50%{opacity:.7}}@keyframes eid-bulb{0%,100%{opacity:.32}50%{opacity:.85}}`}</style>
        <filter id="eid-sf" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
        <pattern id="eid-kpat" patternUnits="userSpaceOnUse" width="6" height="6"><line x1="0" y1="0" x2="6" y2="6" stroke={accent} strokeWidth=".55" opacity=".8"/><line x1="6" y1="0" x2="0" y2="6" stroke={accent} strokeWidth=".55" opacity=".8"/></pattern>
      </defs>
      {/* Crescent moon */}
      <g transform="translate(352,145)" opacity=".2"><circle r="30" fill={accent}/><circle cx="10" cy="-7" r="26" fill="#F3FBF5"/></g>
      {/* Twinkling 6-point stars */}
      {([[40,135,4.5],[115,118,3.5],[200,145,5.5],[52,215,3.5],[162,200,4.5],[325,185,3],[88,318,4],[252,288,5],[378,278,3.5],[28,480,4],[172,448,3.5],[342,418,4],[78,638,3.5],[222,598,4.5],[362,578,3],[138,728,3.5],[302,718,5]] as number[][]).map(([cx,cy,R],i)=>{
        const pts=Array.from({length:12},(_,j)=>{const a=(j*30-90)*Math.PI/180;const rr=j%2===0?R:R*.42;return`${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`;}).join(' ');
        return <polygon key={`es${i}`} points={pts} fill={accent} style={{animation:`eid-tw ${2.5+i*.32}s ease-in-out ${i*.17}s infinite`}} opacity=".16"/>;
      })}
      {/* String lights row 1 */}
      <path d="M-2,112 Q40,137 80,122 Q120,107 160,134 Q200,160 240,140 Q280,120 320,144 Q360,167 402,150" stroke={accent} strokeWidth="1" opacity=".22" fill="none"/>
      {([[0,117,'#C94B20'],[40,132,accent],[80,124,'#D4920A'],[120,114,'#C94B20'],[160,137,accent],[200,157,'#D4920A'],[240,140,'#C94B20'],[280,122,accent],[320,144,'#D4920A'],[360,164,'#C94B20'],[400,150,accent]] as [number,number,string][]).map(([bx,by,bc],i)=>(
        <g key={`b1${i}`}><ellipse cx={bx} cy={by+7} rx="3" ry="4.5" fill={bc} style={{animation:`eid-bulb ${1.6+i*.4}s ease-in-out ${i*.22}s infinite`}} opacity=".62"/><ellipse cx={bx} cy={by+7} rx="5.5" ry="7" fill={bc} filter="url(#eid-sf)" opacity=".18" style={{animation:`eid-bulb ${1.6+i*.4}s ease-in-out ${i*.22}s infinite`}}/></g>
      ))}
      {/* String lights row 2 */}
      <path d="M-2,240 Q40,265 80,250 Q120,233 160,260 Q200,287 240,267 Q280,247 320,271 Q360,295 402,277" stroke={accent} strokeWidth="1" opacity=".2" fill="none"/>
      {([[0,245,accent],[40,263,'#D4920A'],[80,252,'#C94B20'],[120,237,accent],[160,263,'#D4920A'],[200,283,'#C94B20'],[240,267,accent],[280,247,'#D4920A'],[320,271,'#C94B20'],[360,293,accent],[400,277,'#D4920A']] as [number,number,string][]).map(([bx,by,bc],i)=>(
        <g key={`b2${i}`}><ellipse cx={bx} cy={by+7} rx="3" ry="4.5" fill={bc} style={{animation:`eid-bulb ${1.8+i*.38}s ease-in-out ${i*.28+.5}s infinite`}} opacity=".55"/><ellipse cx={bx} cy={by+7} rx="5.5" ry="7" fill={bc} filter="url(#eid-sf)" opacity=".16" style={{animation:`eid-bulb ${1.8+i*.38}s ease-in-out ${i*.28+.5}s infinite`}}/></g>
      ))}
      {/* Swaying lanterns */}
      {([[80,120,13,38,'4s',0],[200,108,11,32,'5.5s',1],[330,125,12,36,'3.8s',-1],[55,348,10,28,'4.5s',2],[295,335,11,30,'5s',-2]] as [number,number,number,number,string,number][]).map(([cx,cy,hw,h,dur,di],i)=>{
        const lc=['#C94B20','#D4920A',accent][i%3];
        const del=`${Math.abs(di)*.55}s`;
        const by=22+h/2;
        return (
          <g key={`el${i}`} transform={`translate(${cx},${cy})`}>
            <g style={{transformBox:'fill-box',transformOrigin:'50% 0%',animation:`eid-sway ${dur} ease-in-out ${del} infinite`} as any}>
              <line x1="0" y1="0" x2="0" y2="18" stroke={lc} strokeWidth="1" opacity=".28"/>
              <rect x={-hw*.8} y={18} width={hw*1.6} height="5" rx="2" fill={lc} opacity=".22"/>
              <rect x={-hw} y={22} width={hw*2} height={h} rx={hw*.35} fill={lc} opacity=".13"/>
              <rect x={-hw} y={22} width={hw*2} height={h} rx={hw*.35} stroke={lc} strokeWidth="1.2" fill="none" opacity=".22"/>
              <ellipse cx="0" cy={by} rx={hw*.55} ry={h*.3} fill={lc} filter="url(#eid-sf)" style={{animation:`eid-glow ${dur} ease-in-out ${del} infinite`} as any} opacity=".28"/>
              <line x1={-hw*.9} y1={22+h/3} x2={hw*.9} y2={22+h/3} stroke={lc} strokeWidth=".7" opacity=".22"/>
              <line x1={-hw*.9} y1={22+h*2/3} x2={hw*.9} y2={22+h*2/3} stroke={lc} strokeWidth=".7" opacity=".22"/>
              <rect x={-hw*.8} y={22+h} width={hw*1.6} height="4" rx="2" fill={lc} opacity=".2"/>
              {Array.from({length:7},(_,k)=>{const fx=-hw*.75+k*(hw*1.5/6);return <line key={k} x1={fx} y1={22+h+4} x2={fx+(k%2===0?1:-1)} y2={22+h+14} stroke={lc} strokeWidth=".9" opacity=".22"/>;})}</g></g>
        );
      })}
      {/* Ketupat */}
      {([[38,310,18],[375,280,15],[108,535,16],[345,510,14],[192,705,15]] as number[][]).map(([cx,cy,r],i)=>{
        const d=`${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}`;
        return (<g key={`ktp${i}`}><polygon points={d} fill="url(#eid-kpat)" opacity=".18"/><polygon points={d} fill={accent} opacity=".05"/><polygon points={d} stroke={accent} strokeWidth="1" fill="none" opacity=".18"/></g>);
      })}
      {/* Mosque silhouette */}
      <g transform="translate(0,622)" opacity=".07" fill={accent}>
        <rect x="75" y="68" width="250" height="130" rx="2"/>
        <ellipse cx="200" cy="68" rx="58" ry="38"/><ellipse cx="118" cy="85" rx="33" ry="21"/><ellipse cx="282" cy="85" rx="33" ry="21"/>
        <rect x="38" y="22" width="22" height="148" rx="3"/><ellipse cx="49" cy="22" rx="11" ry="7"/><line x1="49" y1="8" x2="49" y2="22" stroke={accent} strokeWidth="2.5"/>
        <rect x="340" y="22" width="22" height="148" rx="3"/><ellipse cx="351" cy="22" rx="11" ry="7"/><line x1="351" y1="8" x2="351" y2="22" stroke={accent} strokeWidth="2.5"/>
        <rect x="95" y="98" width="15" height="22" rx="7.5"/><rect x="125" y="98" width="15" height="22" rx="7.5"/>
        <rect x="188" y="90" width="24" height="28" rx="12"/><rect x="260" y="98" width="15" height="22" rx="7.5"/><rect x="290" y="98" width="15" height="22" rx="7.5"/>
      </g>
      {/* Sparkles */}
      {([[155,105],[300,135],[30,380],[375,368],[198,405],[62,698],[348,692]] as number[][]).map(([cx,cy],i)=>(
        <g key={`sp${i}`} transform={`translate(${cx},${cy})`} style={{animation:`eid-tw ${3+i*.45}s ease-in-out ${i*.38}s infinite`} as any} opacity=".15">
          <line x1="0" y1="-5" x2="0" y2="5" stroke={accent} strokeWidth=".9"/>
          <line x1="-5" y1="0" x2="5" y2="0" stroke={accent} strokeWidth=".9"/>
          <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke={accent} strokeWidth=".6"/>
          <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke={accent} strokeWidth=".6"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='kota_malam') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" fill="none">
      <defs><style>{`
        @keyframes km-tw { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        @keyframes km-wi { 0%, 100% { opacity: 0.12; } 50% { opacity: 0.35; } }
        @keyframes km-bl { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes km-sh { 0% { transform: translate(-100px, -100px); opacity: 0; } 5% { opacity: 1; } 10% { transform: translate(400px, 400px); opacity: 0; } 100% { opacity: 0; } }
        @keyframes km-cl { from { transform: translateX(-100px); } to { transform: translateX(500px); } }
        @keyframes km-tr { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
        @keyframes km-pl { 0% { transform: translate(-50px, 80px); } 100% { transform: translate(450px, 120px); } }
        @keyframes km-pl-bl { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        .km-s { animation: km-tw var(--d) infinite; }
        .km-w { animation: km-wi var(--d) infinite; }
        .km-b { animation: km-bl 1.2s step-end infinite; }
        .km-shoot { animation: km-sh 14s linear infinite; }
        .km-cloud { animation: km-cl var(--d) linear infinite; }
        .km-traffic { stroke-dasharray: 4 10; animation: km-tr 2s linear infinite; }
        .km-plane { animation: km-pl 45s linear infinite; }
        .km-plane-bl { animation: km-pl-bl 0.8s infinite; }
      `}</style></defs>
      <rect width="400" height="800" fill="url(#km-sky-grad)"/>
      <defs>
        <linearGradient id="km-sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020408"/><stop offset="100%" stopColor="#050912"/>
        </linearGradient>
      </defs>
      {[...Array(80)].map((_, i) => (
        <circle key={i} className="km-s" cx={(i*137)%400} cy={(i*83)%600} r={0.4+(i%3)*0.4} fill={accent} style={{"--d":`${2.5+i%4}s`} as any} opacity={0.2+(i%4)*0.1}/>
      ))}
      <path className="km-shoot" d="M0,0 L40,40" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0"/>
      <g className="km-plane"><circle r="1" fill="#fff" className="km-plane-bl"/><line x1="-4" y1="0" x2="4" y2="0" stroke="#fff" strokeWidth="0.5" opacity=".3"/></g>
      {[[10,150,90],[180,100,110],[320,250,95]].map(([x,y,d],i)=>(
        <g key={i} className="km-cloud" style={{"--d":`${d}s`} as any} opacity=".015" transform={`translate(${x},${y})`}>
          <circle cx="0" cy="0" r="22" fill={accent}/><circle cx="20" cy="-8" r="28" fill={accent}/><circle cx="45" cy="0" r="22" fill={accent}/>
        </g>
      ))}
      <g transform="translate(340, 70)" opacity=".15"><circle r="25" fill={accent}/><circle cx="10" cy="-5" r="22" fill="#05080E"/></g>
      <g opacity=".35" transform="translate(0, 630)"><path d="M0,80 L30,60 L60,85 L90,55 L130,85 L170,45 L210,90 L250,55 L290,85 L340,40 L400,90 V170 H0 Z" fill="#030509"/></g>
      <g transform="translate(0, 560)">
        {/* Apartment 1: Compact with balconies */}
        <rect x="0" y="80" width="60" height="160" fill="#030509" opacity=".8"/>
        {[0,1,2,3].map(j=><g key={j} transform={`translate(0, ${j*35})`}>
          <rect x="10" y={100} width="15" height="10" rx="1" fill={accent} className="km-w" style={{"--d":"3s"} as any}/>
          <rect x="8" y={112} width="20" height="2" fill="#080C15"/> {/* balcony floor */}
          <rect x="8" y={108} width="1" height="4" fill="#080C15"/> {/* railing */}
          <rect x="18" y={108} width="1" height="4" fill="#080C15"/>
          <rect x="28" y={108} width="1" height="4" fill="#080C15"/>
        </g>)}
        {/* Apartment 2: Tall with side AC units */}
        <rect x="65" y="40" width="65" height="200" fill="#04070C" opacity=".8"/>
        {[0,1,2,3,4,5].map(j=><g key={j} transform={`translate(0, ${j*30})`}>
          <rect x="75" y="60" width="10" height="12" rx="1.5" fill={accent} className="km-w" style={{"--d":"2.5s"} as any}/>
          <rect x="105" y="60" width="10" height="12" rx="1.5" fill={accent} className="km-w" style={{"--d":"4s"} as any}/>
          {j%2===0 && <rect x="116" y={65} width="6" height="5" fill="#050910"/>} {/* AC Unit */}
        </g>)}
        {/* Apartment 3: Rooftop detail */}
        <rect x="135" y="100" width="80" height="140" fill="#030509" opacity=".8"/>
        <rect x="145" y="85" width="20" height="15" fill="#0C1423"/> {/* roof structure */}
        <rect x="175" y="70" width="4" height="30" fill="#0C1423"/> {/* antenna */}
        <circle cx="177" cy="65" r="1.5" fill="#f00" className="km-b"/>
        {[0,1,2,3].map(r=>(
          <g key={r} transform={`translate(0,${r*30})`}>
            {[0,1,2].map(c=>(<rect key={c} x={145+c*22} y={115} width="12" height="8" rx="1" fill={accent} className="km-w" style={{"--d":`${3+c}s`} as any}/>))}
          </g>
        ))}
        {/* Apartment 4: Wide balcony complex */}
        <rect x="220" y="60" width="90" height="180" fill="#04070C" opacity=".8"/>
        {[0,1,2,3,4].map(j=><g key={j} transform={`translate(0, ${j*32})`}>
          <rect x="230" y={80} width="70" height="2" fill="#05080C" opacity=".8"/> {/* long balcony */}
          <rect x="235" y={70} width="8" height="10" fill={accent} className="km-w" style={{"--d":"3.5s"} as any}/>
          <rect x="255" y={70} width="8" height="10" fill={accent} className="km-w" style={{"--d":"2.2s"} as any}/>
          <rect x="275" y={70} width="8" height="10" fill={accent} className="km-w" style={{"--d":"3.8s"} as any}/>
        </g>)}
        {/* Building 5: Plain block with side windows */}
        <rect x="315" y="90" width="45" height="150" fill="#020304"/>
        {[0,1,2,3,4].map(j=><rect key={j} x="345" y={110+j*25} width="5" height="4" fill={accent} opacity=".15"/>)}
        {/* Building 6: Edge building */}
        <rect x="365" y="50" width="35" height="190" fill="#030509"/>
        {[0,1,2,3,4,5,6].map(j=><rect key={j} x="375" y={70+j*24} width="15" height="3" fill={accent} className="km-w" style={{"--d":`${2+j%3}s`} as any}/>)}
      </g>
      <g transform="translate(0, 760)">
        <line x1="0" y1="0" x2="400" y2="0" stroke="#fbbf24" strokeWidth="1.5" className="km-traffic" style={{"--d":"1s"} as any} opacity=".4"/>
        <line x1="0" y1="6" x2="400" y2="6" stroke="#f87171" strokeWidth="1.2" className="km-traffic" style={{"--d":"1.5s"} as any} opacity=".3"/>
      </g>
      <rect x="0" y="720" width="400" height="80" fill="url(#km-glow-v2)"/>
      <defs>
        <linearGradient id="km-glow-v2" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity=".05"/><stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
  return null;
});


const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

const PROMPTS = [
  "Apa yang membuatmu tersenyum hari ini?",
  "Ceritakan satu hal kecil yang membuatmu bersyukur.",
  "Bagaimana perasaanmu saat ini, sungguh-sungguh?",
  "Apa yang ingin kamu katakan pada dirimu sendiri?",
  "Tuliskan satu hal yang ingin kamu ingat dari hari ini.",
  "Siapa yang ada di pikiranmu hari ini?",
  "Apa yang kamu pelajari tentang dirimu hari ini?",
  "Jika hari ini punya warna, warna apa?",
];
const getPrompt = (ds: string) => PROMPTS[ds.split("-").reduce((a,b) => a + parseInt(b), 0) % PROMPTS.length];

const Ic = ({ d, size = 18, sw = 1.5, color }: { d: string; size?: number; sw?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
const IC = {
  back: "M19 12H5M12 19l-7-7 7-7",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M12 5l7 7-7 7",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  search: "M11 11m-7 0a7 7 0 1014 0 7 7 0 10-14 0M21 21l-4.35-4.35",
  chevL: "M15 6l-6 6 6 6",
  chevR: "M9 6l6 6-6 6",
  cal: "M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7zM3 10h18M8 2v4M16 2v4",
  sticker: "M14.5 13.5c1.5 0 2.5-1 2.5-2.5V7M9.5 13.5C8 13.5 7 12.5 7 11V7M12 15v4m-3 0h6",
  x: "M18 6L6 18M6 6l12 12",
  lock: "M12 11v4m0 0h.01M7 10h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2zM9 10V7a3 3 0 016 0v3",
  unlock: "M12 11v4m0 0h.01M7 10h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2zM9 10V5a3 3 0 013-3 3 3 0 013 3",
  pin: "M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  share: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  focus: "M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M16 21h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3",
  minimize: "M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3",
};

const timeStr = (ts: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};
const fullD = (s: string) => { const d=new Date(s+"T00:00:00"); return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const shortD = (s: string) => { const d=new Date(s+"T00:00:00"); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const entryFontFamily = (e: any) => NOTE_FONTS.find(f=>f.id===(e?.font||''))?.family || "'Lora', serif";

const stickerPositions = (count: number) => {
  const positions: any[] = [];
  const seed = [12,67,34,89,45,23,78,56,91,8,73,42,61,17,85,39,54,70,26,95];
  for (let i = 0; i < count; i++) {
    const s = seed[i % seed.length];
    positions.push({ top:(s*3+i*17)%80+5, left:(s*7+i*23)%75+10, rot:((s+i*13)%60)-30, scale:0.9+(s%4)*0.15 });
  }
  return positions;
};

const DownloadModal = memo(function DownloadModal({ onTxt, onPdf, onCancel }: { onTxt: () => void, onPdf: () => void, onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleCancel = () => { setClosing(true); setTimeout(onCancel, 200); };
  return (
    <div className="modal-bg" onClick={handleCancel} style={{zIndex:1100}}>
      <div className={`modal ${closing?'modal-closing':''}`} onClick={e=>e.stopPropagation()} style={{maxWidth:340,padding:"32px 24px",textAlign:"center"}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:"rgba(196,149,106,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Ic d={IC.download} size={24} color="var(--accent)"/>
        </div>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.45rem",color:"var(--ink)",marginBottom:10,fontWeight:500}}>Unduh Catatan</h3>
        <p style={{fontFamily:"'Lora',serif",fontSize:".88rem",color:"var(--ink2)",lineHeight:1.6,marginBottom:28}}>Pilih format berkas untuk menyimpan catatan ini ke perangkatmu.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          <button className="gb" onClick={onTxt} style={{justifyContent:"center",padding:"14px",borderRadius:12,background:"var(--surface)",border:"1.5px solid var(--line)",fontSize:".9rem",gap:10,width:"100%"}}>
            <Ic d={IC.dots} size={16} color="var(--ink2)"/> Catatan Teks (.txt)
          </button>
          <button className="gb" onClick={onPdf} style={{justifyContent:"center",padding:"14px",borderRadius:12,background:"var(--accent)",color:"#fff",border:"none",fontSize:".9rem",gap:10,width:"100%",boxShadow:"0 4px 12px rgba(196,149,106,0.25)"}}>
            <Ic d={IC.edit} size={16} color="#fff"/> Dokumen PDF (.pdf)
          </button>
        </div>
        <button onClick={handleCancel} style={{background:"none",border:"none",color:"var(--ink3)",fontSize:".8rem",fontFamily:"'Lora',serif",cursor:"pointer",textDecoration:"underline"}}>Batal</button>
      </div>
    </div>
  );
});

// ─── Delete Confirmation Modal ───
const DeleteModal = memo(function DeleteModal({ entry, onConfirm, onCancel }: { entry: any; onConfirm: () => void; onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const m = entry?.mood != null ? MOODS[entry.mood] : null;
  const dateObj = entry?.date ? new Date(entry.date + "T00:00:00") : new Date();

  const handleCancel = () => {
    setClosing(true);
    setTimeout(onCancel, 200);
  };
  const handleConfirm = () => {
    setClosing(true);
    setTimeout(onConfirm, 200);
  };

  return (
    <div className="modal-bg" onClick={handleCancel}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e=>e.stopPropagation()}>
        {/* Top accent — mood colored or default warm */}
        <div style={{
          height: 3,
          background: m ? `linear-gradient(90deg, ${m.color}, ${m.border})` : "linear-gradient(90deg, var(--accent), var(--accent-soft))",
        }} />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #FEF5F1, #FDF0EA)",
            border: "1px solid #F0D5CA",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, margin: "0 auto 20px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" opacity=".5" />
            </svg>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.4rem", fontWeight: 500,
            color: "var(--ink)", marginBottom: 8, lineHeight: 1.3,
          }}>
            Hapus catatan ini?
          </h3>

          <p style={{
            fontFamily: "'Lora', serif",
            fontSize: ".88rem", color: "var(--ink2)",
            lineHeight: 1.6, marginBottom: 20,
          }}>
            Catatan ini akan hilang selamanya dan tidak bisa dikembalikan.
          </p>

          {/* Entry preview card */}
          {entry && (entry.title || entry.text) && (
            <div style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: m?.bg || "var(--bg)",
              border: `1px solid ${m?.border || "var(--line)"}`,
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Left accent bar */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: m?.color || "var(--accent-soft)",
                borderRadius: "12px 0 0 12px",
              }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontFamily: "'Lora', serif", fontSize: ".7rem",
                  color: m?.color || "var(--ink3)",
                }}>
                  {dateObj.getDate()} {MONTHS[dateObj.getMonth()]}
                </span>
                {m && <span style={{ fontSize: ".8rem" }}>{m.emoji}</span>}
                {entry.stickers?.length > 0 && (
                  <span style={{ fontSize: ".6rem", opacity: .6 }}>
                    {entry.stickers.slice(0, 3).join("")}
                  </span>
                )}
              </div>

              {entry.title && (
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: ".98rem", fontWeight: 500,
                  color: "var(--ink)", marginBottom: 3,
                  lineHeight: 1.3,
                }}>
                  {entry.title}
                </p>
              )}
              {entry.text && (
                <p style={{
                  fontFamily: "'Lora', serif",
                  fontSize: ".78rem", color: "var(--ink2)",
                  lineHeight: 1.5,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                }}>
                  {getPreviewText(entry.text)}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleCancel}
              style={{
                flex: 1, padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--ink2)",
                fontFamily: "'Lora', serif",
                fontSize: ".88rem", fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink2)"; }}
            >
              Simpan
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 1, padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #E8C4B8",
                background: "linear-gradient(135deg, #C27054, #B5624A)",
                color: "#fff",
                fontFamily: "'Lora', serif",
                fontSize: ".88rem", fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s",
                boxShadow: "0 2px 8px rgba(194, 112, 84, 0.2)",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(194, 112, 84, 0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(194, 112, 84, 0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const DeleteManyModal = memo(function DeleteManyModal({ count, hasLocked, onConfirm, onCancel }: { count: number; hasLocked: boolean; onConfirm: () => void; onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleCancel = () => { setClosing(true); setTimeout(onCancel, 200); };
  const handleConfirm = () => { setClosing(true); setTimeout(onConfirm, 200); };
  return (
    <div className="modal-bg" onClick={handleCancel}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #C04040, #E06060)" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(181,112,90,.12)", border: "1px solid rgba(181,112,90,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6" opacity=".5"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            Hapus {count} catatan?
          </h3>
          <p style={{ fontFamily: "'Lora', serif", fontSize: ".88rem", color: "var(--ink2)", lineHeight: 1.6, marginBottom: hasLocked ? 16 : 24, textAlign: "center" }}>
            Semua catatan yang dipilih akan hilang selamanya dan tidak bisa dikembalikan.
          </p>
          {hasLocked && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(181,112,90,.12)", border: "1px solid rgba(181,112,90,.3)", marginBottom: 24 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ fontFamily: "'Lora', serif", fontSize: ".78rem", color: "#B5705A", margin: 0, lineHeight: 1.5 }}>Termasuk catatan yang terkunci. Identitas sudah diverifikasi.</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCancel} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink2)", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer" }}>Batal</button>
            <button onClick={handleConfirm} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E8C4B8", background: "linear-gradient(135deg, #C27054, #B5624A)", color: "#fff", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", boxShadow: "0 2px 8px rgba(194,112,84,.2)" }}>Hapus Semua</button>
          </div>
        </div>
      </div>
    </div>
  );
});

const LogoutModal = memo(function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleCancel = () => { setClosing(true); setTimeout(onCancel, 200); };
  const handleConfirm = () => { setClosing(true); setTimeout(onConfirm, 200); };
  return (
    <div className="modal-bg" onClick={handleCancel}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #FEF5F1, #FDF0EA)",
            border: "1px solid #F0D5CA",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            Logout?
          </h3>
          <p style={{ fontFamily: "'Lora', serif", fontSize: ".88rem", color: "var(--ink2)", lineHeight: 1.6, marginBottom: 24, textAlign: "center" }}>
            Kamu akan keluar dari akun ini.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCancel} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink2)", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink2)"; }}>
              Batal
            </button>
            <button onClick={handleConfirm} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E8C4B8", background: "linear-gradient(135deg, #C27054, #B5624A)", color: "#fff", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s", boxShadow: "0 2px 8px rgba(194, 112, 84, 0.2)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(194, 112, 84, 0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(194, 112, 84, 0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const NotifPermissionModal = memo(function NotifPermissionModal({ onAllow, onLater }: { onAllow: () => void; onLater: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleLater = () => { setClosing(true); setTimeout(onLater, 200); };
  const handleAllow = () => { setClosing(true); setTimeout(onAllow, 200); };
  return (
    <div className="modal-bg" onClick={handleLater}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #FFF8ED, #FFF0D4)",
            border: "1px solid #F0D9A8",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4956A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            Aktifkan Pengingat Streak
          </h3>
          <p style={{ fontFamily: "'Lora', serif", fontSize: ".88rem", color: "var(--ink2)", lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>
            Izinkan notifikasi agar kami bisa mengingatkanmu menulis setiap hari dan menjaga streakmu tetap hidup 🔥
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleLater} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink2)", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink2)"; }}>
              Nanti
            </button>
            <button onClick={handleAllow} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E8D9A8", background: "linear-gradient(135deg, #C4956A, #B5844A)", color: "#fff", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s", boxShadow: "0 2px 8px rgba(196,149,106,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(196,149,106,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(196,149,106,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Izinkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const StickerPicker = memo(function StickerPicker({ stickers = [], onToggle, onClose }: { stickers: string[]; onToggle: (s: string) => void; onClose: () => void }) {
  const [cat, setCat] = useState(0);
  return (
    <div style={{
      background:"var(--surface)",border:"1px solid var(--line)",borderRadius:16,
      padding:"16px 18px",boxShadow:"0 8px 32px rgba(46,37,32,0.1)",
      animation:"fadeUp .3s ease both",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:"var(--ink)",fontWeight:500}}>Stiker & Dekorasi</span>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink3)",display:"flex"}}>
          <Ic d={IC.x} size={16} sw={1.8}/>
        </button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {STICKER_CATS.map((c,i) => (
          <button key={i} onClick={()=>setCat(i)}
            style={{
              padding:"5px 12px",borderRadius:16,border:"1px solid",whiteSpace:"nowrap",
              borderColor: cat===i ? "var(--accent)" : "var(--line)",
              background: cat===i ? "var(--accent-soft)" : "transparent",
              color: cat===i ? "var(--accent)" : "var(--ink2)",
              fontFamily:"'Lora',serif",fontSize:".72rem",cursor:"pointer",transition:"all .2s",
            }}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {STICKER_CATS[cat].stickers.map((s,i) => {
          const active = stickers.includes(s);
          return (
            <button key={i} onClick={()=>onToggle(s)}
              style={{
                width:38,height:38,borderRadius:10,border:"1.5px solid",
                borderColor: active ? "var(--accent)" : "transparent",
                background: active ? "var(--accent-soft)" : "transparent",
                fontSize:"1.25rem",cursor:"pointer",transition:"all .15s",
                display:"flex",alignItems:"center",justifyContent:"center",
                transform: active ? "scale(1.1)" : "scale(1)",
              }}>
              {s}
            </button>
          );
        })}
      </div>
      {stickers.length > 0 && (
        <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid var(--line)"}}>
          <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",marginBottom:8}}>Terpilih ({stickers.length})</p>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {stickers.map((s,i) => (
              <button key={i} onClick={()=>onToggle(s)}
                style={{
                  width:32,height:32,borderRadius:8,border:"1px solid var(--line)",
                  background:"var(--surface)",fontSize:"1.05rem",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const StickerDisplay = memo(function StickerDisplay({ stickers = [] }: { stickers: string[] }) {
  if (!stickers.length) return null;
  const positions = stickerPositions(stickers.length);
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {stickers.map((s, i) => {
        const p = positions[i];
        return (
          <span key={i} style={{
            position:"absolute", top:`${p.top}%`, left:`${p.left}%`,
            transform:`rotate(${p.rot}deg) scale(${p.scale})`,
            fontSize:"1.6rem", opacity:.18,
            animation:`fadeUp .6s ease ${.1+i*.08}s both`,
            userSelect:"none",
          }}>{s}</span>
        );
      })}
    </div>
  );
});

const BottomSheet = memo(function BottomSheet({ onClose, title, children }: { onClose: () => void; title?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const dragY = useRef(0);

  // Touch handlers attached ONLY to the handle pill — avoids conflicts with inner scroll
  const onHandleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // prevent scroll while dragging handle
    startY.current = e.touches[0].clientY;
    dragY.current = 0;
    if (ref.current) {
      ref.current.style.transition = "none";
      ref.current.style.willChange = "transform";
    }
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    dragY.current = dy;
    if (ref.current) ref.current.style.transform = `translateY(${dy}px)`;
  };
  const onHandleTouchEnd = () => {
    if (!ref.current) return;
    ref.current.style.willChange = "auto";
    if (dragY.current > 80) {
      // snap to close with animation
      ref.current.style.transition = "transform .26s cubic-bezier(.4,0,1,1)";
      ref.current.style.transform = "translateY(110%)";
      setTimeout(onClose, 260);
    } else {
      // snap back with spring
      ref.current.style.transition = "transform .32s cubic-bezier(.16,1,.3,1)";
      ref.current.style.transform = "translateY(0)";
    }
  };

  return (
    <>
      <div className="asheet-bg" onClick={onClose}/>
      <div ref={ref} className="asheet">
        {/* Handle — larger tap area (32px), visual pill in center */}
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          style={{ padding: "14px 0 10px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "grab", touchAction: "none", userSelect: "none" }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line)" }}/>
        </div>
        {title && <p className="asheet-title">{title}</p>}
        {children}
      </div>
    </>
  );
});

const AuthForm = memo(function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Read ?error= from URL (e.g. OAuthAccountNotLinked)
  const urlError = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("error")
    : null;
  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked: "Email ini sudah terdaftar dengan password. Masuk pakai email & password.",
    OAuthSignin: "Gagal login dengan Google. Coba lagi.",
    Callback: "Terjadi kesalahan saat login. Coba lagi.",
  };
  const [error, setError] = useState(urlError ? (errorMessages[urlError] ?? "Terjadi kesalahan login.") : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.error) setError("Email atau password salah.");
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (res.ok) { await signIn("credentials", { email, password, redirect: false }); }
        else { setError(data.error || "Pendaftaran gagal."); }
      }
    } catch (err) { setError("Terjadi kesalahan. Coba lagi."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:20, fontFamily:"'Lora',serif" }}>
      <div style={{ width:"100%", maxWidth:400, background:"var(--surface)", padding:40, borderRadius:24, boxShadow:"var(--shadow)", border:"1px solid var(--line)" }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.4rem", textAlign:"center", marginBottom:8, color:"var(--ink)" }}>Catatanku</h1>
        <p style={{ textAlign:"center", color:"var(--ink2)", fontSize:".9rem", marginBottom:32 }}>
          {isLogin ? "Selamat datang kembali." : "Mulai perjalanan menulismu."}
        </p>

        {/* Google Sign-In */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          disabled={loading}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"13px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", fontSize:".9rem", fontWeight:600, color:"var(--ink)", cursor:"pointer", marginBottom:20, transition:"box-shadow .15s" }}
          onMouseOver={e=>(e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.1)")}
          onMouseOut={e=>(e.currentTarget.style.boxShadow="none")}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Lanjutkan dengan Google
        </button>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:"var(--line)" }}/>
          <span style={{ fontSize:".75rem", color:"var(--ink3)" }}>atau</span>
          <div style={{ flex:1, height:1, background:"var(--line)" }}/>
        </div>

        <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column", gap:16}}>
          {!isLogin && <input type="text" placeholder="Nama Lengkap" value={name} onChange={e=>setName(e.target.value)} required style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", outline:"none" }}/>}
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", outline:"none" }}/>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", outline:"none" }}/>
          {error && <p style={{color:"#C27054", fontSize:".8rem", textAlign:"center"}}>{error}</p>}
          <button type="submit" disabled={loading} style={{ padding:"14px", borderRadius:12, border:"none", background:"var(--accent)", color:"#fff", fontFamily:"'Lora',serif", fontWeight:600, cursor:"pointer", marginTop:8, transition:"opacity .2s" }}>
            {loading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar")}
          </button>
        </form>
        <p style={{textAlign:"center", marginTop:24, fontSize:".85rem", color:"var(--ink2)"}}>
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button onClick={()=>setIsLogin(!isLogin)} style={{background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontWeight:600}}>
            {isLogin ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  );
});

// ── UnlockModal — supports both password and PIN lock types ─────────────────
const UnlockModal = memo(function UnlockModal({
  onUnlock, onClose, error, setError,
  lockType = "password",
  title, description, actionLabel = "Buka Catatan", accentColor,
}: {
  onUnlock: (p: string) => void; onClose: () => void; error: string; setError: (s: string) => void;
  lockType?: "password" | "pin"; title?: string; description?: string; actionLabel?: string; accentColor?: string;
}) {
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPin = lockType === "pin";
  const defaultTitle = isPin ? "Masukkan PIN" : "Verifikasi Identitas";
  const defaultDesc  = isPin ? "Catatan ini dilindungi PIN. Masukkan PIN untuk membukanya." : "Masukkan kata sandi akunmu untuk membuka catatan ini.";

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);
  useEffect(() => { if (error) setLoading(false); }, [error]);

  const handleSubmit = () => {
    if (!p.trim()) { setError(isPin ? "PIN tidak boleh kosong." : "Kata sandi tidak boleh kosong."); return; }
    if (isPin && !/^\d{4,6}$/.test(p)) { setError("PIN harus 4–6 digit angka."); return; }
    setLoading(true);
    setError("");
    onUnlock(p);
  };

  const btnBg = accentColor || "var(--accent)";

  return (
    <div className="modal-bg">
      <div className="modal" style={{padding: 0, overflow: "hidden", textAlign: "left"}}>
        <div style={{height: 4, background: accentColor ? `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` : "linear-gradient(90deg, var(--accent), var(--accent-soft))"}}/>
        <div style={{padding: "24px 28px 28px"}}>
          <div style={{width: 48, height: 48, borderRadius: 14, background: accentColor ? `${accentColor}18` : "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: accentColor || "var(--accent)"}}>
            {isPin
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="9.5" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><rect x="16" y="9.5" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="9.5" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/></svg>
              : <Ic d={IC.lock} size={24} sw={2}/>
            }
          </div>
          <h2 style={{fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6}}>{title ?? defaultTitle}</h2>
          <p style={{fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 28}}>{description ?? defaultDesc}</p>
          <div style={{position: "relative", marginBottom: 12}}>
            <input
              ref={inputRef}
              type="password"
              inputMode={isPin ? "numeric" : undefined}
              maxLength={isPin ? 6 : undefined}
              value={p}
              onChange={e => { setP(isPin ? e.target.value.replace(/\D/g, "") : e.target.value); if (error) setError(""); }}
              placeholder={isPin ? "PIN (4–6 digit)..." : "Kata sandi..."}
              onKeyDown={e => e.key === "Enter" && !loading && handleSubmit()}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                border: `1.5px solid ${error ? "#D4856A" : "var(--line)"}`,
                fontSize: isPin ? "1.3rem" : ".9rem", letterSpacing: isPin ? ".3em" : undefined,
                background: "var(--surface)", fontFamily: "'Lora',serif", color: "var(--ink)",
                outline: "none", boxSizing: "border-box", transition: "border-color .2s",
                textAlign: isPin ? "center" : "left",
              }}
            />
          </div>
          {error && (
            <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 16}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C27054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{color: "#C27054", fontSize: ".78rem", fontFamily: "'Lora',serif", margin: 0}}>{error}</p>
            </div>
          )}
          <button className="gb" onClick={handleSubmit} disabled={loading}
            style={{width: "100%", padding: "13px", borderRadius: 12, background: btnBg, color: "#fff", fontWeight: 600, fontSize: ".9rem", fontFamily: "'Lora',serif", marginBottom: 10, opacity: loading ? 0.7 : 1, transition: "opacity .2s"}}>
            {loading ? "Memverifikasi..." : actionLabel}
          </button>
          <button className="gb" onClick={onClose} style={{width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)", fontFamily: "'Lora',serif"}}>
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
});

// ── LockNoteModal — choose password or PIN, handle Google-only (no password) ─
const LockNoteModal = memo(function LockNoteModal({
  noteId, hasPassword, accentColor, csrf,
  onLocked, onClose,
}: {
  noteId: string; hasPassword: boolean; accentColor?: string; csrf: string;
  onLocked: (lockType: "password" | "pin") => void; onClose: () => void;
}) {
  type Step = "choose" | "set-password" | "confirm-password" | "set-pin";
  const [step, setStep]     = useState<Step>("choose");
  const [lockType, setLockType] = useState<"password" | "pin">("password");
  const [input, setInput]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, [step]);

  const chooseType = (type: "password" | "pin") => {
    setLockType(type);
    setInput(""); setConfirm(""); setError("");
    if (type === "pin") { setStep("set-pin"); return; }
    setStep(hasPassword ? "confirm-password" : "set-password");
  };

  const doSetPassword = async () => {
    if (input.length < 6) { setError("Kata sandi minimal 6 karakter."); return; }
    if (input !== confirm) { setError("Konfirmasi kata sandi tidak cocok."); return; }
    setLoading(true); setError("");
    try {
      const r1 = await fetch("/api/user/set-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input, confirmPassword: confirm }),
      });
      if (!r1.ok) { setError((await r1.json()).error || "Gagal membuat kata sandi."); setLoading(false); return; }
      // Now lock the note with the new password
      const r2 = await fetch("/api/notes/lock", {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ noteId, lockType: "password", password: input }),
      });
      if (!r2.ok) { setError((await r2.json()).error || "Gagal mengunci."); setLoading(false); return; }
      onLocked("password");
    } catch { setError("Terjadi kesalahan. Coba lagi."); setLoading(false); }
  };

  const doConfirmPassword = async () => {
    if (!input) { setError("Masukkan kata sandi."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/notes/lock", {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ noteId, lockType: "password", password: input }),
      });
      if (!r.ok) { setError((await r.json()).error || "Kata sandi salah."); setLoading(false); return; }
      onLocked("password");
    } catch { setError("Terjadi kesalahan. Coba lagi."); setLoading(false); }
  };

  const doSetPin = async () => {
    if (!/^\d{4,6}$/.test(input)) { setError("PIN harus 4–6 digit angka."); return; }
    if (input !== confirm) { setError("Konfirmasi PIN tidak cocok."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/notes/lock", {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ noteId, lockType: "pin", pin: input }),
      });
      if (!r.ok) { setError((await r.json()).error || "Gagal mengunci."); setLoading(false); return; }
      onLocked("pin");
    } catch { setError("Terjadi kesalahan. Coba lagi."); setLoading(false); }
  };

  const btnBg = accentColor || "var(--accent)";
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: `1.5px solid ${error ? "#D4856A" : "var(--line)"}`,
    fontSize: ".9rem", background: "var(--surface)", fontFamily: "'Lora',serif",
    color: "var(--ink)", outline: "none", boxSizing: "border-box",
  };
  const pinInputStyle: React.CSSProperties = {
    ...inputStyle, fontSize: "1.3rem", letterSpacing: ".3em", textAlign: "center",
  };

  return (
    <div className="modal-bg">
      <div className="modal" style={{padding: 0, overflow: "hidden", textAlign: "left"}}>
        <div style={{height: 4, background: `linear-gradient(90deg, ${btnBg}, ${btnBg}99)`}}/>
        <div style={{padding: "24px 28px 28px"}}>
          {/* Icon */}
          <div style={{width: 48, height: 48, borderRadius: 14, background: `${btnBg}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: btnBg}}>
            <Ic d={IC.lock} size={24} sw={2}/>
          </div>

          {/* ── Step: choose ── */}
          {step === "choose" && (<>
            <h2 style={{fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6}}>Kunci Catatan</h2>
            <p style={{fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 24}}>Pilih cara mengunci catatan ini.</p>
            <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 16}}>
              <button onClick={() => chooseType("password")} style={{display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 12, border: "1.5px solid var(--line)", background: "var(--bg)", cursor: "pointer", textAlign: "left", transition: "border-color .18s"}}>
                <div style={{width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)"}}>
                  <Ic d={IC.lock} size={18} sw={2}/>
                </div>
                <div>
                  <p style={{fontFamily: "'Lora',serif", fontSize: ".88rem", fontWeight: 600, color: "var(--ink)", margin: "0 0 3px"}}>Kata Sandi Akun</p>
                  <p style={{fontFamily: "'Lora',serif", fontSize: ".76rem", color: "var(--ink3)", margin: 0, lineHeight: 1.5}}>Semua catatan dikunci dengan satu kata sandi yang sama.{!hasPassword && " (Kamu belum punya kata sandi — akan dibuat sekarang.)"}</p>
                </div>
              </button>
              <button onClick={() => chooseType("pin")} style={{display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 12, border: "1.5px solid var(--line)", background: "var(--bg)", cursor: "pointer", textAlign: "left", transition: "border-color .18s"}}>
                <div style={{width: 36, height: 36, borderRadius: 10, background: "rgba(100,120,220,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#5566CC"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="4" height="4" rx="1"/><rect x="10" y="3" width="4" height="4" rx="1"/><rect x="17" y="3" width="4" height="4" rx="1"/><rect x="3" y="10" width="4" height="4" rx="1"/><rect x="10" y="10" width="4" height="4" rx="1"/><rect x="17" y="10" width="4" height="4" rx="1"/><rect x="3" y="17" width="4" height="4" rx="1"/><rect x="10" y="17" width="4" height="4" rx="1"/><rect x="17" y="17" width="4" height="4" rx="1"/></svg>
                </div>
                <div>
                  <p style={{fontFamily: "'Lora',serif", fontSize: ".88rem", fontWeight: 600, color: "var(--ink)", margin: "0 0 3px"}}>PIN</p>
                  <p style={{fontFamily: "'Lora',serif", fontSize: ".76rem", color: "var(--ink3)", margin: 0, lineHeight: 1.5}}>Setiap catatan bisa punya PIN berbeda (4–6 digit angka).</p>
                </div>
              </button>
            </div>
            <button className="gb" onClick={onClose} style={{width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)", fontFamily: "'Lora',serif"}}>Batal</button>
          </>)}

          {/* ── Step: set-password (Google user, no password yet) ── */}
          {step === "set-password" && (<>
            <h2 style={{fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6}}>Buat Kata Sandi</h2>
            <p style={{fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 24}}>Akun Google-mu belum punya kata sandi. Buat sekarang untuk mengunci catatan.</p>
            <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 14}}>
              <input ref={inputRef} type="password" value={input} onChange={e => { setInput(e.target.value); setError(""); }} placeholder="Kata sandi baru (min. 6 karakter)" style={inputStyle} onKeyDown={e => e.key === "Enter" && doSetPassword()}/>
              <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} placeholder="Konfirmasi kata sandi" style={inputStyle} onKeyDown={e => e.key === "Enter" && doSetPassword()}/>
            </div>
            {error && <p style={{color: "#C27054", fontSize: ".8rem", fontFamily: "'Lora',serif", marginBottom: 12}}>{error}</p>}
            <button className="gb" onClick={doSetPassword} disabled={loading}
              style={{width: "100%", padding: "13px", borderRadius: 12, background: btnBg, color: "#fff", fontWeight: 600, fontSize: ".9rem", fontFamily: "'Lora',serif", marginBottom: 8, opacity: loading ? 0.7 : 1}}>
              {loading ? "Menyimpan..." : "Simpan & Kunci"}
            </button>
            <button className="gb" onClick={() => { setStep("choose"); setInput(""); setConfirm(""); setError(""); }} style={{width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)", fontFamily: "'Lora',serif"}}>Kembali</button>
          </>)}

          {/* ── Step: confirm-password (user already has password) ── */}
          {step === "confirm-password" && (<>
            <h2 style={{fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6}}>Konfirmasi Kata Sandi</h2>
            <p style={{fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 24}}>Masukkan kata sandi akunmu untuk mengunci catatan ini.</p>
            <div style={{marginBottom: 14}}>
              <input ref={inputRef} type="password" value={input} onChange={e => { setInput(e.target.value); setError(""); }} placeholder="Kata sandi..." style={inputStyle} onKeyDown={e => e.key === "Enter" && doConfirmPassword()}/>
            </div>
            {error && <p style={{color: "#C27054", fontSize: ".8rem", fontFamily: "'Lora',serif", marginBottom: 12}}>{error}</p>}
            <button className="gb" onClick={doConfirmPassword} disabled={loading}
              style={{width: "100%", padding: "13px", borderRadius: 12, background: btnBg, color: "#fff", fontWeight: 600, fontSize: ".9rem", fontFamily: "'Lora',serif", marginBottom: 8, opacity: loading ? 0.7 : 1}}>
              {loading ? "Mengunci..." : "Kunci Catatan"}
            </button>
            <button className="gb" onClick={() => { setStep("choose"); setInput(""); setError(""); }} style={{width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)", fontFamily: "'Lora',serif"}}>Kembali</button>
          </>)}

          {/* ── Step: set-pin ── */}
          {step === "set-pin" && (<>
            <h2 style={{fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6}}>Buat PIN</h2>
            <p style={{fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 24}}>PIN ini hanya berlaku untuk catatan ini. Masukkan 4–6 digit angka, lalu konfirmasi.</p>
            <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 14}}>
              <input ref={inputRef} type="password" inputMode="numeric" maxLength={6} value={input} onChange={e => { setInput(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="PIN (4–6 digit)" style={pinInputStyle} onKeyDown={e => e.key === "Enter" && doSetPin()}/>
              <input type="password" inputMode="numeric" maxLength={6} value={confirm} onChange={e => { setConfirm(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="Konfirmasi PIN" style={pinInputStyle} onKeyDown={e => e.key === "Enter" && doSetPin()}/>
            </div>
            {error && <p style={{color: "#C27054", fontSize: ".8rem", fontFamily: "'Lora',serif", marginBottom: 12}}>{error}</p>}
            <button className="gb" onClick={doSetPin} disabled={loading}
              style={{width: "100%", padding: "13px", borderRadius: 12, background: btnBg, color: "#fff", fontWeight: 600, fontSize: ".9rem", fontFamily: "'Lora',serif", marginBottom: 8, opacity: loading ? 0.7 : 1}}>
              {loading ? "Mengunci..." : "Kunci dengan PIN"}
            </button>
            <button className="gb" onClick={() => { setStep("choose"); setInput(""); setConfirm(""); setError(""); }} style={{width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)", fontFamily: "'Lora',serif"}}>Kembali</button>
          </>)}
        </div>
      </div>
    </div>
  );
});

const ShareModal = memo(function ShareModal({ shareId, isLocked, songTitle, shareMusic, onToggleMusic, onClose, onShare, onRevoke }: { shareId: string|null; isLocked?: boolean; songTitle?: string; shareMusic?: boolean; onToggleMusic?: () => void; onClose: () => void; onShare: (isOneTime?: boolean) => Promise<void>; onRevoke: () => Promise<void> }) {
  const [copied, setCopied] = useState(false);
  const [isOneTime, setIsOneTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const shareUrl = typeof window !== 'undefined' && shareId ? `${window.location.origin}/share/${shareId}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleShare = async () => {
    setLoading(true);
    await onShare(isOneTime);
    setLoading(false);
  };

  const handleRevoke = async () => {
    setLoading(true);
    await onRevoke();
    setLoading(false);
    setRevokeConfirm(false);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: "hidden", textAlign: "left" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }} />
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 20px", color: "var(--accent)" }}>
            <Ic d={IC.share} size={22} sw={2} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Bagikan Catatan</h2>
          <p style={{ fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 24 }}>
            {isLocked ? "Catatan yang terkunci tidak bisa dibagikan secara publik." : shareId ? "Siapapun dengan tautan ini dapat membaca catatan ini." : "Buat tautan publik untuk berbagi catatan ini."}
          </p>

          {!isLocked && !shareId && (
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "var(--bg)", border: isOneTime ? "1.5px solid var(--accent)" : "1px solid var(--line)", marginBottom: 16, cursor: loading ? "default" : "pointer", transition: "all .2s", opacity: loading ? .7 : 1 }}
              onClick={() => !loading && setIsOneTime(!isOneTime)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.2rem" }}>👁️</span>
                <div>
                  <p style={{ fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink)", margin: 0, fontWeight: 600 }}>Sekali Lihat</p>
                  <p style={{ fontFamily: "'Lora',serif", fontSize: ".65rem", color: "var(--ink3)", margin: 0 }}>Tautan otomatis hangus setelah dibaca.</p>
                </div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: isOneTime ? "var(--accent)" : "var(--line)", position: "relative", transition: "background .2s" }}>
                <span style={{ position: "absolute", top: 3, left: isOneTime ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }}/>
              </div>
            </div>
          )}

          {isLocked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--line)", marginBottom: 8 }}>
              <Ic d={IC.lock} size={16} color="var(--ink3)"/>
              <p style={{ fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", margin: 0, lineHeight: 1.5 }}>Lepas kunci catatan terlebih dahulu untuk bisa membagikannya.</p>
            </div>
          ) : shareId ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--line)", fontFamily: "'Lora',serif", fontSize: ".78rem", color: "var(--ink2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</div>
                <button onClick={copyLink} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: copied ? "var(--accent)" : "var(--accent-soft)", color: copied ? "#fff" : "var(--accent)", fontFamily: "'Lora',serif", fontSize: ".84rem", cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap", fontWeight: 500 }}>
                  {copied ? "✓ Tersalin" : "Salin"}
                </button>
              </div>
              {revokeConfirm ? (
                <div style={{ borderRadius: 12, border: "1px solid #F0D5CA", padding: "14px 16px", marginBottom: 8, background: "rgba(240,213,202,0.15)" }}>
                  <p style={{ fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink2)", margin: "0 0 12px", lineHeight: 1.55 }}>Yakin hapus tautan ini? Orang lain tidak bisa lagi membaca catatan ini.</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleRevoke} disabled={loading} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "#B5705A", color: "#fff", fontFamily: "'Lora',serif", fontSize: ".82rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1 }}>
                      {loading ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                    <button onClick={() => setRevokeConfirm(false)} disabled={loading} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid var(--line)", background: "transparent", color: "var(--ink3)", fontFamily: "'Lora',serif", fontSize: ".82rem", cursor: loading ? "not-allowed" : "pointer" }}>
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setRevokeConfirm(true)} disabled={loading} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1px solid #F0D5CA", background: "transparent", color: "#B5705A", fontFamily: "'Lora',serif", fontSize: ".84rem", cursor: loading ? "not-allowed" : "pointer", marginBottom: 8, opacity: loading ? .6 : 1 }}>
                  Hapus Tautan
                </button>
              )}
            </>
          ) : (
            <button onClick={handleShare} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "'Lora',serif", fontSize: ".9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: 8, opacity: loading ? .7 : 1 }}>
              {loading ? "Memproses..." : "Buat Tautan Publik"}
            </button>
          )}
          {songTitle && !isLocked && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:12,background:"var(--bg)",border:"1px solid var(--line)",marginBottom:8,opacity:loading?.6:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:".9rem"}}>🎵</span>
                <div>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink)",margin:0,fontWeight:500}}>Sertakan lagu</p>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",margin:0,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{songTitle}</p>
                </div>
              </div>
              <button onClick={onToggleMusic} disabled={loading} style={{width:40,height:22,borderRadius:11,border:"none",background:shareMusic?"var(--accent)":"var(--line)",cursor:loading?"not-allowed":"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                <span style={{position:"absolute",top:3,left:shareMusic?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
              </button>
            </div>
          )}
          <button className="gb" onClick={onClose} disabled={loading} style={{ width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)", cursor: loading ? "not-allowed" : "pointer" }}>Tutup</button>
        </div>
      </div>
    </div>
  );
});

const toggleTodoLine = (text: string, lineIdx: number): string => {
  const lines = text.split('\n');
  const line = lines[lineIdx];
  if (line.startsWith('--x ')) lines[lineIdx] = '-- ' + line.slice(4);
  else if (line === '--x') lines[lineIdx] = '--';
  else if (line.startsWith('-- ')) lines[lineIdx] = '--x ' + line.slice(3);
  else if (line === '--') lines[lineIdx] = '--x';
  return lines.join('\n');
};

type Block =
  | { type: 'text'; content: string }
  | { type: 'todo'; content: string; done: boolean }
  | { type: 'image'; url: string; size?: 'sm' | 'md' | 'lg' | 'full'; align?: 'left' | 'center' | 'right' }
  | { type: 'gallery'; cols: 2 | 3; urls: string[] }
  | { type: 'link'; url: string; title?: string; description?: string; image?: string; favicon?: string }
  | { type: 'table'; rows: string[][] };

const VALID_SIZES = new Set(['sm','md','lg','full']);
const VALID_ALIGNS = new Set(['left','center','right']);

const parseBlocks = (raw: string): Block[] => {
  // Pre-process: ensure [IMAGE:] and [GALLERY:] markers are always on their own line.
  // Handles: <div>[IMAGE:url]</div>, text<div>[IMAGE:]</div>more, and other embedded cases.
  const pre = (raw || '')
    .replace(/<div[^>]*>(\[(?:IMAGE|GALLERY):[^\]]+\])<\/div>/gi, '\n$1\n')
    .replace(/([^\n])(\[(?:IMAGE|GALLERY):[^\]]+\])/g, '$1\n$2')
    .replace(/(\[(?:IMAGE|GALLERY):[^\]]+\])(?=[^\n])/g, '$1\n');
  const lines = pre.split('\n');
  const out: Block[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (line.startsWith('[IMAGE:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const parts = line.slice(7, -1).split('|');
      let align: 'left'|'center'|'right'|undefined;
      let size: 'sm'|'md'|'lg'|'full'|undefined;
      if (parts.length > 1 && VALID_ALIGNS.has(parts[parts.length - 1])) align = parts.pop() as any;
      if (parts.length > 1 && VALID_SIZES.has(parts[parts.length - 1])) size = parts.pop() as any;
      out.push({ type: 'image', url: parts.join('|'), size, align });
    } else if (line.startsWith('[GALLERY:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const inner = line.slice(9, -1);
      const parts = inner.split('|');
      const cols = (parseInt(parts[0]) === 3 ? 3 : 2) as 2 | 3;
      out.push({ type: 'gallery', cols, urls: parts.slice(1) });
    } else if (line.startsWith('[LINK:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const parts = line.slice(6, -1).split('|');
      out.push({ type: 'link', url: parts[0]||'', title: decCell(parts[1]||''), description: decCell(parts[2]||''), image: decCell(parts[3]||''), favicon: decCell(parts[4]||'') });
    } else if (line.startsWith('[TABLE:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const inner = line.slice(7, -1);
      const pipeIdx = inner.indexOf('|');
      const dim = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
      const [rStr, cStr] = dim.split('x');
      const rows = Math.max(1, parseInt(rStr)||1), cols = Math.max(1, parseInt(cStr)||1);
      const cells = pipeIdx === -1 ? [] : inner.slice(pipeIdx + 1).split('|').map(decCell);
      const tableRows: string[][] = [];
      for (let r = 0; r < rows; r++) tableRows.push(Array.from({ length: cols }, (_, c) => cells[r * cols + c] ?? ''));
      out.push({ type: 'table', rows: tableRows });
    } else if (/^--x?\s/.test(line) || line === '--' || line === '--x') {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      out.push({ type: 'todo', done: line.startsWith('--x'), content: line.replace(/^--x?\s?/, '') });
    } else {
      buf.push(line);
    }
  }
  if (buf.length) out.push({ type: 'text', content: buf.join('\n') });
  if (!out.length) out.push({ type: 'text', content: '' });
  return out;
};

const encCell = (s: string) => s.replace(/\|/g, '{{P}}').replace(/\n/g, '{{N}}');
const decCell = (s: string) => s.replace(/\{\{P\}\}/g, '|').replace(/\{\{N\}\}/g, '\n');

const blocksToText = (blocks: Block[]): string =>
  blocks.map(b =>
    b.type === 'todo' ? (b.done ? '--x ' : '-- ') + b.content :
    b.type === 'image' ? `[IMAGE:${b.url}${b.size ? '|' + b.size : ''}${b.align ? '|' + b.align : ''}]` :
    b.type === 'gallery' ? `[GALLERY:${b.cols}|${b.urls.join('|')}]` :
    b.type === 'link' ? `[LINK:${b.url}|${encCell(b.title||'')}|${encCell(b.description||'')}|${encCell(b.image||'')}|${encCell(b.favicon||'')}]` :
    b.type === 'table' ? `[TABLE:${b.rows.length}x${b.rows[0]?.length||0}|${b.rows.flat().map(encCell).join('|')}]` :
    b.content
  ).join('\n');

const stripHtml = (html: string) => html
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/\s+/g, ' ')
  .trim();

const getLinkImage = (text: string): string => {
  for (const l of (text || '').split('\n')) {
    if (l.startsWith('[LINK:') && l.endsWith(']')) {
      const parts = l.slice(6, -1).split('|');
      const img = decCell(parts[3] || '');
      if (img) return img;
    }
  }
  return '';
};

const getPreviewText = (text: string) =>
  (text || '').split('\n').map(l => {
    if (l.startsWith('[IMAGE:') || l.startsWith('[GALLERY:')) return '';
    if (l.startsWith('[LINK:') && l.endsWith(']')) {
      const parts = l.slice(6, -1).split('|');
      return decCell(parts[1] || '') || parts[0] || '';
    }
    if (l.startsWith('[TABLE:') && l.endsWith(']')) {
      const pipeIdx = l.indexOf('|', 7);
      if (pipeIdx === -1) return '';
      return l.slice(pipeIdx + 1).split('|').slice(0, 5).map(decCell).filter(Boolean).join('  ·  ');
    }
    return stripHtml(l);
  }).filter(Boolean).join('\n');

// ── Inline formatting + line alignment helpers ──────────────────────
function parseLineStyle(line: string): { align: 'left'|'center'|'right'; text: string } {
  if (line.startsWith('::::')) return { align: 'right', text: line.slice(4) };
  if (line.startsWith(':::'))  return { align: 'center', text: line.slice(3) };
  return { align: 'left', text: line };
}

function renderInline(raw: string): React.ReactNode {
  const hasMarkup = raw.includes('**') || raw.includes('_') || raw.includes('<u>') ||
    raw.includes('~~') || raw.includes('`') || raw.includes('[') || raw.includes('[[');
  if (!hasMarkup) return raw;
  const parts: React.ReactNode[] = [];
  const re = /\[\[(.+?)\]\]|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|~~(.+?)~~|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|_(.+?)_|<u>(.+?)<\/u>/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push(raw.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<span key={m.index} className="note-link" data-note-link={m[1]}>{m[1]}</span>);
    else if (m[2] !== undefined) parts.push(<strong key={m.index}><em>{m[2]}</em></strong>);
    else if (m[3] !== undefined) parts.push(<strong key={m.index} style={{fontWeight:700}}>{m[3]}</strong>);
    else if (m[4] !== undefined) parts.push(<s key={m.index} style={{opacity:0.6}}>{m[4]}</s>);
    else if (m[5] !== undefined) parts.push(<code key={m.index} style={{background:'var(--surface2,rgba(0,0,0,0.07))',color:'var(--ink)',borderRadius:4,padding:'1px 5px',fontFamily:'monospace',fontSize:'0.88em'}}>{m[5]}</code>);
    else if (m[6] !== undefined) parts.push(<a key={m.index} href={m[7]} target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)',textDecoration:'underline',textDecorationColor:'rgba(196,149,106,0.4)'}}>{m[6]}</a>);
    else if (m[8] !== undefined) parts.push(<em key={m.index} style={{fontStyle:'italic'}}>{m[8]}</em>);
    else parts.push(<u key={m.index}>{m[9]}</u>);
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push(raw.slice(last));
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

function AlignIcon({ align }: { align: 'left'|'center'|'right'|'justify' }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const };
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
      <line {...s} x1="0" y1="1.5" x2="15" y2="1.5"/>
      {align === 'left'    && <><line {...s} x1="0" y1="6"   x2="11" y2="6"/><line {...s} x1="0" y1="10.5" x2="8"  y2="10.5"/></>}
      {align === 'center'  && <><line {...s} x1="2" y1="6"   x2="13" y2="6"/><line {...s} x1="3.5" y1="10.5" x2="11.5" y2="10.5"/></>}
      {align === 'right'   && <><line {...s} x1="4" y1="6"   x2="15" y2="6"/><line {...s} x1="7"   y1="10.5" x2="15" y2="10.5"/></>}
      {align === 'justify' && <><line {...s} x1="0" y1="6"   x2="15" y2="6"/><line {...s} x1="0" y1="10.5" x2="15" y2="10.5"/></>}
    </svg>
  );
}

// Deterministic dummy text — same result for same (words, seed)
const makeDummy = (words: number, seed: string): string => {
  const ch = 'abcdefghijklmnopqrstuvwxyz';
  let n = seed.split('').reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 1);
  const rng = () => { n = (Math.imul(n, 1664525) + 1013904223) | 0; return (n >>> 0) / 0x100000000; };
  return Array.from({ length: Math.max(1, words) }, () =>
    Array.from({ length: 3 + Math.floor(rng() * 7) }, () => ch[Math.floor(rng() * 26)]).join('')
  ).join(' ');
};

type PendingMode =
  | { mode: 'insert'; at: number }
  | { mode: 'replace'; at: number }
  | { mode: 'gallery-add'; at: number }
  | { mode: 'gallery-replace'; at: number; idx: number }
  | { mode: 'gallery-new'; at: number };

function mdInline(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<s style="opacity:.6">$1</s>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface2,#f1f0ee);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:.88em">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;text-underline-offset:2px">$1</a>');
}

function markdownToBlocks(md: string): Block[] {
  const MAX_INPUT_LENGTH = 20000;
  if (!md || md.length > MAX_INPUT_LENGTH) {
    return [{ type: 'text', content: md || '' }];
  }

  // Normalize line endings (\r\n and \r → \n)
  const lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result: Block[] = [];
  let currentPara: string[] = [];

  const flushPara = () => {
    if (currentPara.length > 0) {
      result.push({ type: 'text', content: currentPara.map(l => `<div>${mdInline(l) || '<br>'}</div>`).join('') });
      currentPara = [];
    }
  };

  const parseTableRow = (r: string): string[] => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim()) && line.trim() !== '') {
      flushPara();
      result.push({ type: 'text', content: '<div><hr style="border:none;border-top:1.5px solid var(--line);margin:6px 0"/></div>' });
      continue;
    }

    // Heading
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      flushPara();
      const level = hm[1].length;
      const fs = level === 1 ? '1.7rem' : level === 2 ? '1.4rem' : level === 3 ? '1.15rem' : '1.05rem';
      const fw = '700';
      const mt = level <= 2 ? 'margin-top:1.4em' : 'margin-top:1.1em';
      result.push({ type: 'text', content: `<div style="font-size:${fs};font-weight:${fw};${mt};margin-bottom:.25em;line-height:1.3">${mdInline(hm[2].trim())}</div>` });
      continue;
    }

    // Table detect
    if (line.includes('|') && i + 1 < lines.length && /^\s*[\|:\-]+[\|:\-\s]*$/.test(lines[i + 1])) {
      flushPara();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      i--; // adjust because for-loop will i++
      const rows = tableLines.filter((_, idx) => idx !== 1).map(parseTableRow).filter(r => r.length > 0 && r.some(c => c !== ''));
      if (rows.length > 0) result.push({ type: 'table', rows });
      continue;
    }

    // Fenced code block
    if (/^```/.test(line)) {
      flushPara();
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
        i++;
      }
      const langLabel = lang ? `<span style="font-size:.65em;opacity:.5;float:right;margin-top:-2px">${lang}</span>` : '';
      result.push({ type: 'text', content: `<div style="background:var(--surface2,rgba(0,0,0,0.07));border-radius:10px;padding:14px 16px;margin:4px 0;overflow-x:auto"><pre style="font-family:monospace;font-size:.85em;line-height:1.6;margin:0;white-space:pre;color:var(--ink)">${langLabel}${codeLines.join('\n')}</pre></div>` });
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushPara();
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(mdInline(lines[i].replace(/^>\s?/, '')));
        i++;
      }
      i--;
      result.push({ type: 'text', content: `<div style="border-left:3px solid var(--accent,#C4956A);padding:6px 14px;margin:4px 0;opacity:.85">${quoteLines.map(q => `<div>${q || '<br>'}</div>`).join('')}</div>` });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<div style="display:flex;gap:8px"><span style="opacity:.5;min-width:1.4em;text-align:right">${num++}.</span><span>${mdInline(lines[i].replace(/^\d+\.\s+/, ''))}</span></div>`);
        i++;
      }
      i--;
      result.push({ type: 'text', content: items.join('') });
      continue;
    }

    // Bullet list
    if (/^[\*\-]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^[\*\-]\s+/.test(lines[i])) {
        items.push(mdInline(lines[i].replace(/^[\*\-]\s+/, '')));
        i++;
      }
      i--; // adjust
      result.push({ type: 'text', content: items.map(it => `<div style="display:flex;gap:8px"><span style="opacity:.45">•</span><span>${it}</span></div>`).join('') });
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushPara();
      continue;
    }

    // Normal text
    currentPara.push(line);
  }
  flushPara();

  return result.length > 0 ? result : [{ type: 'text', content: '' }];
}

function looksLikeMarkdown(text: string): boolean {
  return /\*\*[^*\n]+\*\*/.test(text) ||
    /^#{1,6}\s/m.test(text) ||
    /^\|.+\|/m.test(text) ||
    /^[\*\-]\s+\S/m.test(text) ||
    /^>\s/m.test(text) ||
    /^\d+\.\s+\S/m.test(text) ||
    /^```/m.test(text) ||
    /~~.+~~/.test(text);
}

// Fast heuristic to detect markdown without heavy regexes
function quickLooksLikeMarkdown(text: string): boolean {
  if (text.includes('#')) return true;
  if (text.includes('|')) return true;
  if (text.includes('**')) return true;
  if (text.includes('~~')) return true;
  if (text.includes('- ')) return true;
  if (text.includes('* ')) return true;
  if (text.includes('> ')) return true;
  if (text.includes('```')) return true;
  return false;
}

const LiveEditor = memo(function LiveEditor({ entries, text, onChange, onUploadImage, onDone, onShowToast, placeholder, autoFocus, fontSize: fz = 1.05, fontFamily: ff = "'Lora', serif" }: { entries: Record<string, any>; text: string; onChange: (t: string) => void; onUploadImage: (file: File) => Promise<string>; onDone?: () => void; onShowToast?: (msg: string) => void; placeholder?: string; autoFocus?: boolean; fontSize?: number; fontFamily?: string }) {
  // Memoize block parsing to avoid re-parsing on every render
  const blocks = useMemo(() => parseBlocks(text), [text]);
  // Tracks the latest blocks immediately (even during debounce window) so handlers always operate on current state
  const localBlocksRef = useRef<Block[]>(blocks);
  
  // Sync local ref when external text changes (e.g. switching notes)
  const lastExternalTextRef = useRef(text);
  useEffect(() => {
    if (text !== lastExternalTextRef.current) {
      localBlocksRef.current = parseBlocks(text);
      lastExternalTextRef.current = text;
      historyRef.current = [text];
      historyPosRef.current = 0;
    }
  }, [text]);

  // Debounced emit to reduce re-renders during rapid input changes
  const emitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleEmit = (newBlocks: Block[]) => {
    if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
    emitTimeoutRef.current = setTimeout(() => {
      emit(newBlocks);
      emitTimeoutRef.current = null;
    }, 100);
  };

  const refs = useRef<(HTMLElement | null)[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAt, setUploadingAt] = useState<number | null>(null);
  const pendingMode = useRef<PendingMode | null>(null);
  const savedSplitRef = useRef<{ at: number; before: string; after: string } | null>(null);
  const historyRef = useRef<string[]>([text]);
  const historyPosRef = useRef<number>(0);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  const [slash, setSlash] = useState<{ visible: boolean; mode: 'command' | 'linking'; query: string; selected: number; idx: number; x: number; y: number }>({ visible: false, mode: 'command', query: '', selected: 0, idx: -1, x: 0, y: 0 });
  const slashMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!slash.visible || !slashMenuRef.current) return;
    const items = slashMenuRef.current.querySelectorAll<HTMLElement>('[data-slash-item]');
    const item = items[slash.selected];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [slash.selected, slash.visible]);

  // ── Floating selection toolbar ──
  const [selToolbar, setSelToolbar] = useState<{ visible: boolean; x: number; y: number; showAbove: boolean }>({ visible: false, x: 0, y: 0, showAbove: true });
  const selToolbarRef = useRef<HTMLDivElement>(null);
  const SELTOOLBAR_W = 330;
  const updateSelToolbar = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelToolbar(t => t.visible ? { ...t, visible: false } : t);
      return;
    }
    try {
      const range = sel.getRangeAt(0);
      const selRect = range.getBoundingClientRect();
      if (!selRect.width && !selRect.height) return;
      const toolbarW = Math.min(SELTOOLBAR_W, window.innerWidth - 16);
      const centerX = selRect.left + selRect.width / 2;
      // x = LEFT EDGE of toolbar, clamped so toolbar never overflows screen
      const x = Math.max(8, Math.min(window.innerWidth - toolbarW - 8, centerX - toolbarW / 2));
      const showAbove = selRect.top > 100;
      const y = showAbove
        ? window.innerHeight - selRect.top + 10
        : selRect.bottom + 10;
      setSelToolbar({ visible: true, x, y, showAbove });
    } catch(_) {}
  };
  useEffect(() => {
    const onSelChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelToolbar(t => t.visible ? { ...t, visible: false } : t);
      }
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

  const slashOptions = [
    { id: 'h1', label: 'Heading 1', sub: 'Besar', icon: 'H1' },
    { id: 'h2', label: 'Heading 2', sub: 'Sedang', icon: 'H2' },
    { id: 'h3', label: 'Heading 3', sub: 'Kecil', icon: 'H3' },
    { id: 'todo', label: 'To-do List', sub: 'Checklist', icon: '✓' },
    { id: 'image', label: 'Gambar', sub: 'Unggah foto', icon: '🖼️' },
    { id: 'gallery', label: 'Galeri', sub: 'Banyak foto', icon: '📷' },
    { id: 'table', label: 'Tabel', sub: 'Data grid', icon: '📊' },
    { id: 'linking', label: 'Tautkan Catatan', sub: 'Hubungkan catatan', icon: '🔗' },
    { id: 'divider', label: 'Pemisah', sub: 'Garis horisontal', icon: '—' },
  ];
  const [fmtState, setFmtState] = useState<{ bold: boolean; italic: boolean; underline: boolean; align: 'left'|'center'|'right'|'justify'; strike: boolean; code: boolean }>({ bold: false, italic: false, underline: false, align: 'left', strike: false, code: false });
  const filteredOptions = slash.mode === 'linking'
    ? Object.values(entries)
        .filter((e: any) => (e.title || "Tanpa Judul").toLowerCase().includes(slash.query.toLowerCase()))
        .sort((a:any, b:any) => b.ts - a.ts)
        .slice(0, 10)
        .map((e: any) => ({ id: `note-${e.id}`, label: e.title || "Tanpa Judul", sub: "Tautkan catatan ini", icon: "📄", title: e.title }))
    : slashOptions.filter(o => o.label.toLowerCase().includes(slash.query.toLowerCase()));
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchLinkPreview = (url: string, currentBlocks: Block[]) => {
    setLinkLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/notes/link-preview?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const meta = await res.json();
          const nb = parseBlocks(blocksToText(currentBlocks));
          const li = nb.findIndex(b => b.type === 'link' && b.url === url);
          if (li !== -1) { nb[li] = { type: 'link', ...meta }; emit(nb); }
        }
      } finally { setLinkLoading(false); }
    })();
  };

  const syncFmt = () => {
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const center = document.queryCommandState('justifyCenter');
      const right = document.queryCommandState('justifyRight');
      const justify = document.queryCommandState('justifyFull');
      const align = center ? 'center' : right ? 'right' : justify ? 'justify' : 'left';
      let strike = false, code = false;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const fi = focusedIdx;
        const elFmt = refs.current[fi] as HTMLDivElement;
        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
        if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
        while (node && node !== elFmt) {
          const tag = (node as Element).tagName?.toLowerCase();
          if (tag === 's') strike = true;
          if (tag === 'code') code = true;
          node = node.parentNode;
        }
      }
      setFmtState(prev =>
        prev.bold === bold && prev.italic === italic && prev.underline === underline && prev.align === align && prev.strike === strike && prev.code === code
          ? prev : { bold, italic, underline, align, strike, code });
    } catch(_) {}
  };

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { onShowToast?.('Browser kamu tidak mendukung voice-to-text. Coba pakai Chrome atau Edge.'); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'id-ID';
    rec.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (!final) return;
      const fi = focusedIdx;
      const el = refs.current[fi] as HTMLDivElement;
      if (!el || blocks[fi]?.type !== 'text') return;
      el.focus();
      // Place cursor at end if nothing selected
      const sel = window.getSelection();
      if (sel && sel.rangeCount === 0) {
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      document.execCommand('insertText', false, final + ' ');
      captureHtml(fi);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const sanitizeCeHtml = (html: string): string => {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // Strip unwanted inline styles, keep only font-weight, font-style, text-align, font-size
    tmp.querySelectorAll<HTMLElement>('[style]').forEach(el => {
      const { fontWeight, fontStyle, textAlign, textDecoration, fontSize } = el.style;
      el.removeAttribute('style');
      if (fontWeight === 'bold' || parseInt(fontWeight) >= 700) el.style.fontWeight = 'bold';
      if (fontStyle === 'italic') el.style.fontStyle = 'italic';
      if (textDecoration.includes('underline')) el.style.textDecoration = 'underline';
      if (textAlign && textAlign !== 'left' && textAlign !== 'start') el.style.textAlign = textAlign;
      if (fontSize) el.style.fontSize = fontSize;
    });
    // Unwrap semantically empty spans (no remaining style)
    tmp.querySelectorAll('span').forEach(span => {
      if (!span.getAttribute('style')) span.replaceWith(...Array.from(span.childNodes));
    });
    return tmp.innerHTML;
  };

  // Convert legacy plain-text content (with \n line breaks) to HTML divs for contenteditable
  const normalizePlainToHtml = (content: string): string => {
    // If it looks like HTML, we still want to sanitize it before returning
    if (/<(?:div|br|strong|em|span|u|code|hr|s|a|pre|h[1-6])\b/i.test(content)) {
      return sanitizeCeHtml(content);
    }
    return content.split('\n').map(line => {
      const { align, text } = parseLineStyle(line);
      const escaped = text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,'<em>$1</em>')
        .replace(/_(.+?)_/g,'<em>$1</em>')
        .replace(/~~(.+?)~~/g,'<s style="opacity:.6">$1</s>')
        .replace(/`([^`]+)`/g,'<code style="background:var(--surface2,rgba(0,0,0,0.07));color:var(--ink);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:.88em">$1</code>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline">$1</a>');
      if (align !== 'left') return `<div style="text-align:${align}">${escaped || '<br>'}</div>`;
      return `<div>${escaped || '<br>'}</div>`;
    }).join('');
  };

  const captureHtml = (fi: number) => {
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;
    const html = sanitizeCeHtml(el.innerHTML);
    el.setAttribute('data-last', html);
    const nb = [...localBlocksRef.current]; nb[fi] = { type: 'text', content: html }; emit(nb);
  };

  const applyInline = (cmd: 'bold'|'italic'|'underline') => {
    const fi = focusedIdx;
    if (blocks[fi]?.type !== 'text') return;
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;
    document.execCommand(cmd, false);
    captureHtml(fi);
    syncFmt();
  };

  const applyTextAlign = (align: 'left'|'center'|'right'|'justify') => {
    const fi = focusedIdx;
    if (blocks[fi]?.type !== 'text') return;
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;
    const cmd = align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : align === 'justify' ? 'justifyFull' : 'justifyLeft';
    const already = align === 'center' ? document.queryCommandState('justifyCenter')
                  : align === 'right'  ? document.queryCommandState('justifyRight')
                  : align === 'justify' ? document.queryCommandState('justifyFull')
                  : document.queryCommandState('justifyLeft');
    document.execCommand(already && align !== 'left' ? 'justifyLeft' : cmd, false);
    captureHtml(fi);
    syncFmt();
  };

  const focusAt = (idx: number) => setTimeout(() => (refs.current[idx] as HTMLElement)?.focus(), 10);

  const wrapSelection = (tag: 's'|'code'|'a', href?: string) => {
    const fi = focusedIdx;
    if (blocks[fi]?.type !== 'text') return;
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;

    // Save selection BEFORE focus() which may clear it
    const selBefore = window.getSelection();
    if (!selBefore || !selBefore.rangeCount) return;
    const savedRange = selBefore.getRangeAt(0).cloneRange();
    const selectedText = savedRange.toString();

    el.focus();
    // Restore selection after focus
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(savedRange);

    // Check if selection is already inside this tag → unwrap
    if (tag === 's' || tag === 'code') {
      let node: Node | null = savedRange.commonAncestorContainer;
      if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
      let wrapper: Element | null = null;
      while (node && node !== el) {
        if ((node as Element).tagName?.toLowerCase() === tag) { wrapper = node as Element; break; }
        node = node.parentNode;
      }
      if (wrapper && wrapper.parentNode) {
        const parent = wrapper.parentNode;
        const frag = document.createDocumentFragment();
        while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
        parent.replaceChild(frag, wrapper);
        captureHtml(fi);
        syncFmt();
        return;
      }
    }

    let html = '';
    if (tag === 's') html = `<s style="opacity:.6">${selectedText || '~~teks~~'}</s>`;
    else if (tag === 'code') html = `<code style="background:var(--surface2,rgba(0,0,0,0.07));color:var(--ink);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:.88em">${selectedText || 'kode'}</code>`;
    else if (tag === 'a' && href) html = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;text-underline-offset:2px">${selectedText || href}</a>`;
    if (html) { document.execCommand('insertHTML', false, html); captureHtml(fi); syncFmt(); }
  };

  const applyHeading = (level: number) => {
    const fi = focusedIdx;
    if (blocks[fi]?.type !== 'text') return;
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;
    el.focus();
    const tags = ['h1','h2','h3','h4'] as const;
    const tag  = tags[level - 1] ?? 'h3';
    // Toggle off if cursor is already inside this heading tag
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== el) {
        if ((node as Element).tagName?.toLowerCase() === tag) {
          document.execCommand('formatBlock', false, 'div');
          captureHtml(fi);
          return;
        }
        node = node.parentNode;
      }
    }
    document.execCommand('formatBlock', false, tag);
    captureHtml(fi);
  };

  const pushHistory = (t: string, immediate: boolean) => {
    const commit = () => {
      if (historyRef.current[historyPosRef.current] === t) return;
      historyRef.current = historyRef.current.slice(0, historyPosRef.current + 1);
      historyRef.current.push(t);
      if (historyRef.current.length > 100) { historyRef.current.shift(); }
      historyPosRef.current = historyRef.current.length - 1;
    };
    if (immediate) {
      if (historyTimerRef.current) { clearTimeout(historyTimerRef.current); historyTimerRef.current = null; }
      commit();
    } else {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
      historyTimerRef.current = setTimeout(commit, 600);
    }
  };
  const undoHistory = () => {
    if (historyPosRef.current <= 0) return;
    historyPosRef.current--;
    const t = historyRef.current[historyPosRef.current];
    localBlocksRef.current = parseBlocks(t);
    lastExternalTextRef.current = t; // prevent useEffect([text]) from wiping history
    onChange(t);
  };
  const execSlashCommand = (id: string, blockIdx: number) => {
    let nb = [...localBlocksRef.current];
    const el = refs.current[blockIdx] as HTMLDivElement;
    
    if (el) {
      el.focus();
      
      if (id === 'linking') {
        setSlash(s => ({ ...s, mode: 'linking', query: '', selected: 0 }));
        return;
      }

      if (id.startsWith('note-')) {
        const noteId = id.replace('note-', '');
        const noteTitle = (filteredOptions[slash.selected] as any)?.title || 'Catatan';
        // Backspace the slash and query
        const len = slash.query.length + 1;
        for (let k = 0; k < len; k++) document.execCommand('delete', false);
        document.execCommand('insertText', false, `[[${noteTitle}]]`);
        setSlash(s => ({ ...s, visible: false }));
        captureHtml(blockIdx);
        return;
      }

      // Backspace the slash and query using native command for reliability
      const len = slash.query.length + 1;
      for (let k = 0; k < len; k++) {
        document.execCommand('delete', false);
      }
    }

    if (id.startsWith('h')) {
      const tag = id === 'h1' ? 'h1' : id === 'h2' ? 'h2' : 'h3';
      document.execCommand('formatBlock', false, tag);
      captureHtml(blockIdx);
    } else if (id === 'todo') {
      captureSplit(blockIdx);
      const sTodo = savedSplitRef.current;
      savedSplitRef.current = null;
      const nb2 = [...localBlocksRef.current];
      if (sTodo) {
        const beforeC = sTodo.before.replace(/<br\s*\/?>/gi, '').trim();
        if (beforeC) {
          nb2[blockIdx] = { type: 'text', content: sTodo.before };
          nb2.splice(blockIdx + 1, 0, { type: 'todo', done: false, content: '' });
          const afterC = sTodo.after.replace(/<br\s*\/?>/gi, '').trim();
          if (afterC) nb2.splice(blockIdx + 2, 0, { type: 'text', content: sTodo.after });
          emit(nb2);
          setTimeout(() => focusAt(blockIdx + 1), 30);
        } else {
          nb2[blockIdx] = { type: 'todo', done: false, content: '' };
          emit(nb2);
          setTimeout(() => focusAt(blockIdx), 30);
        }
      } else {
        nb2[blockIdx] = { type: 'todo', done: false, content: '' };
        emit(nb2);
        setTimeout(() => focusAt(blockIdx), 30);
      }
    } else {
      // Split commands: divider, image, table, etc.
      captureSplit(blockIdx);
      const s = savedSplitRef.current;
      savedSplitRef.current = null;

      if (id === 'divider') {
        const item: Block = { type: 'text', content: '<hr style="border:none;border-top:1.5px solid var(--line);margin:12px 0">' };
        if (s) {
          const nb2 = [...localBlocksRef.current];
          nb2[blockIdx] = { type: 'text', content: s.before || '<br>' };
          nb2.splice(blockIdx + 1, 0, item);
          const afterC = s.after.replace(/<br\s*\/?>/gi, '').trim();
          if (afterC) nb2.splice(blockIdx + 2, 0, { type: 'text', content: s.after });
          emit(nb2);
        } else {
          nb.splice(blockIdx + 1, 0, item);
          emit(nb);
        }
      } else if (id === 'image') {
        savedSplitRef.current = s; // Persist for handleFile
        setTimeout(() => triggerImageAt(blockIdx), 0);
      } else if (id === 'gallery') {
        savedSplitRef.current = s;
        setTimeout(() => triggerGalleryNew(blockIdx), 0);
      } else if (id === 'table') {
        const item: Block = { type: 'table', rows: [['',''],['','']] };
        if (s) {
          const nb2 = [...localBlocksRef.current];
          nb2[blockIdx] = { type: 'text', content: s.before || '<br>' };
          nb2.splice(blockIdx + 1, 0, item);
          const afterC = s.after.replace(/<br\s*\/?>/gi, '').trim();
          if (afterC) nb2.splice(blockIdx + 2, 0, { type: 'text', content: s.after });
          emit(nb2);
          setTimeout(() => focusAt(blockIdx + 1), 30);
        } else {
          nb.splice(blockIdx + 1, 0, item);
          emit(nb);
          setTimeout(() => focusAt(blockIdx + 1), 30);
        }
      }
    }
    setSlash(s => ({ ...s, visible: false }));
  };

  const redoHistory = () => {
    if (historyPosRef.current >= historyRef.current.length - 1) return;
    historyPosRef.current++;
    const t = historyRef.current[historyPosRef.current];
    localBlocksRef.current = parseBlocks(t);
    lastExternalTextRef.current = t; // prevent useEffect([text]) from wiping history
    onChange(t);
  };
  const onChangeDebouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // debounce=true for text typing, false for block ops
  const emit = (nb: Block[], debounce = false) => {
    if (!nb.length) nb.push({ type: 'text', content: '' });
    localBlocksRef.current = nb; // Always update immediately so ref callback never resets DOM
    const t = blocksToText(nb);
    lastExternalTextRef.current = t; // prevent useEffect([text]) from wiping history
    pushHistory(t, !debounce);
    if (debounce) {
      if (onChangeDebouncedRef.current) clearTimeout(onChangeDebouncedRef.current);
      onChangeDebouncedRef.current = setTimeout(() => { onChange(t); onChangeDebouncedRef.current = null; }, 150);
    } else {
      if (onChangeDebouncedRef.current) { clearTimeout(onChangeDebouncedRef.current); onChangeDebouncedRef.current = null; }
      onChange(t);
    }
  };
  const del = (i: number) => { const nb = localBlocksRef.current.filter((_, j) => j !== i); emit(nb); };
  const move = (i: number, dir: -1 | 1) => { const cur = localBlocksRef.current; if (i + dir < 0 || i + dir >= cur.length) return; const nb = [...cur]; [nb[i], nb[i + dir]] = [nb[i + dir], nb[i]]; emit(nb); };

  // Smart move for image/gallery: steps one paragraph at a time through adjacent text blocks
  const moveMedia = (i: number, dir: -1 | 1) => {
    const adjIdx = i + dir;
    if (adjIdx < 0 || adjIdx >= localBlocksRef.current.length) return;
    const adj = localBlocksRef.current[adjIdx];
    if (adj.type !== 'text') { move(i, dir); return; }

    const content = adj.content;
    const isHtml = /<(?:div|br|strong|em|span)\b/i.test(content);
    const SEP_HTML = '<div><br></div>';
    let splitBefore = "", splitAfter = "", found = false;

    if (dir === -1) {
      // Moving UP → split at LAST paragraph break; keep separator with the "before" half
      if (isHtml) {
        const idx = content.lastIndexOf(SEP_HTML);
        if (idx !== -1) { splitBefore = content.slice(0, idx + SEP_HTML.length); splitAfter = content.slice(idx + SEP_HTML.length); found = true; }
      } else {
        const idx = content.lastIndexOf('\n\n');
        if (idx !== -1) { splitBefore = content.slice(0, idx + 2); splitAfter = content.slice(idx + 2); found = true; }
      }
    } else {
      // Moving DOWN → split at FIRST paragraph break; keep separator with the "after" half
      if (isHtml) {
        const idx = content.indexOf(SEP_HTML);
        if (idx !== -1) { splitBefore = content.slice(0, idx); splitAfter = content.slice(idx); found = true; }
      } else {
        const idx = content.indexOf('\n\n');
        if (idx !== -1) { splitBefore = content.slice(0, idx); splitAfter = content.slice(idx); found = true; }
      }
    }

    if (!found) { move(i, dir); return; }

    const nb = [...localBlocksRef.current];
    const media = nb[i];
    const start = Math.min(i, adjIdx);
    const newBlocks: Block[] = [];
    if (splitBefore) newBlocks.push({ type: 'text', content: splitBefore });
    newBlocks.push(media);
    if (splitAfter) newBlocks.push({ type: 'text', content: splitAfter });
    nb.splice(start, 2, ...newBlocks);
    emit(nb);
  };
  const triggerImageAt = (afterIdx: number) => { pendingMode.current = { mode: 'insert', at: afterIdx }; fileRef.current?.click(); };
  const triggerImageReplace = (idx: number) => { pendingMode.current = { mode: 'replace', at: idx }; fileRef.current?.click(); };
  const triggerGalleryAdd = (at: number) => { pendingMode.current = { mode: 'gallery-add', at }; fileRef.current?.click(); };
  const triggerGalleryNew = (at: number) => { pendingMode.current = { mode: 'gallery-new', at }; fileRef.current?.click(); };
  const setSize = (i: number, size: 'sm' | 'md' | 'lg' | 'full') => {
    const nb = [...localBlocksRef.current];
    if (nb[i].type === 'image') nb[i] = { ...nb[i] as any, size };
    emit(nb);
  };
  const setAlign = (i: number, align: 'left' | 'center' | 'right') => {
    const nb = [...localBlocksRef.current];
    if (nb[i].type === 'image') nb[i] = { ...nb[i] as any, align };
    emit(nb);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const pm = pendingMode.current; e.target.value = ''; pendingMode.current = null;
    if (!pm) return;
    // Snapshot pre-upload state so Ctrl+Z can revert the image insertion
    pushHistory(blocksToText(localBlocksRef.current), true);
    setUploadingAt(pm.at);
    try {
      const url = await onUploadImage(file);
      const nb = [...localBlocksRef.current];
      if (pm.mode === 'insert') {
        const split = savedSplitRef.current;
        savedSplitRef.current = null;
        if (split && split.at === pm.at && localBlocksRef.current[pm.at]?.type === 'text') {
          nb[pm.at] = { type: 'text', content: split.before };
          nb.splice(pm.at + 1, 0, { type: 'image', url });
          nb.splice(pm.at + 2, 0, { type: 'text', content: split.after });
        } else {
          nb.splice(pm.at + 1, 0, { type: 'image', url });
          if (!nb[pm.at + 2] || nb[pm.at + 2].type !== 'text') nb.splice(pm.at + 2, 0, { type: 'text', content: '' });
        }
      } else if (pm.mode === 'replace') {
        nb[pm.at] = { ...nb[pm.at] as any, url };
      } else if (pm.mode === 'gallery-add') {
        const g = nb[pm.at];
        if (g.type === 'gallery') nb[pm.at] = { ...g, urls: [...g.urls, url] };
      } else if (pm.mode === 'gallery-replace') {
        const g = nb[pm.at];
        if (g.type === 'gallery') { const urls = [...g.urls]; urls[pm.idx] = url; nb[pm.at] = { ...g, urls }; }
      } else if (pm.mode === 'gallery-new') {
        nb.splice(pm.at + 1, 0, { type: 'gallery', cols: 2, urls: [url] });
        if (!nb[pm.at + 2] || nb[pm.at + 2].type !== 'text') nb.splice(pm.at + 2, 0, { type: 'text', content: '' });
      }
      emit(nb);
    } catch { /* upload failed silently */ }
    finally { setUploadingAt(null); }
  };

  const handlePasteImage = async (file: File, atIdx: number) => {
    // Snapshot pre-paste state into history NOW (before async upload starts)
    // so Ctrl+Z always has a target to revert to, regardless of debounce timing.
    pushHistory(blocksToText(localBlocksRef.current), true);
    setUploadingAt(atIdx);
    try {
      const url = await onUploadImage(file);
      const nb = [...localBlocksRef.current];
      const split = savedSplitRef.current; savedSplitRef.current = null;
      if (split && split.at === atIdx && nb[atIdx]?.type === 'text') {
        nb[atIdx] = { type: 'text', content: split.before };
        nb.splice(atIdx + 1, 0, { type: 'image', url });
        nb.splice(atIdx + 2, 0, { type: 'text', content: split.after });
      } else {
        nb.splice(atIdx + 1, 0, { type: 'image', url });
        if (!nb[atIdx + 2] || nb[atIdx + 2].type !== 'text') nb.splice(atIdx + 2, 0, { type: 'text', content: '' });
      }
      emit(nb);
    } catch { } finally { setUploadingAt(null); }
  };

  const captureSplit = (i: number) => {
    const sel = window.getSelection();
    const el = refs.current[i] as HTMLDivElement | null;
    if (sel && sel.rangeCount > 0 && el) {
      const selRange = sel.getRangeAt(0);
      if (el.contains(selRange.commonAncestorContainer)) {
        try {
          const beforeRange = document.createRange();
          beforeRange.setStart(el, 0); beforeRange.setEnd(selRange.startContainer, selRange.startOffset);
          const tmpBefore = document.createElement('div'); tmpBefore.appendChild(beforeRange.cloneContents());
          const afterRange = document.createRange();
          afterRange.setStart(selRange.endContainer, selRange.endOffset); afterRange.setEnd(el, el.childNodes.length);
          const tmpAfter = document.createElement('div'); tmpAfter.appendChild(afterRange.cloneContents());
          savedSplitRef.current = { at: i, before: sanitizeCeHtml(tmpBefore.innerHTML), after: sanitizeCeHtml(tmpAfter.innerHTML) };
          return;
        } catch { }
      }
    }
    savedSplitRef.current = null;
  };

  const BlockControls = ({ i }: { i: number }) => (
    <div style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity .15s' }} className="blk-ctrl">
      <button onClick={() => move(i, -1)} disabled={i === 0} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink3)', padding: '2px 4px', fontSize: '.72rem', borderRadius: 4 }}>↑</button>
      <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink3)', padding: '2px 4px', fontSize: '.72rem', borderRadius: 4 }}>↓</button>
      <button onClick={() => del(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#C27054', padding: '2px 4px', fontSize: '.72rem', borderRadius: 4 }}>✕</button>
    </div>
  );

  const fmtBtn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink2)', padding: '4px 8px', borderRadius: 6, transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 };

  return (
    <div ref={editorRef} style={{ position: 'relative' }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {/* ── Formatting toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12, padding: '3px 6px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--line)', width: 'fit-content', flexWrap: 'wrap' as const }}>
        <button className="fmt-btn" title="Tebal (Ctrl+B)"
          onMouseDown={e => e.preventDefault()} onClick={() => applyInline('bold')}
          style={{ ...fmtBtn, fontFamily: "'Lora',serif", fontSize: '.85rem', fontWeight: 700,
            background: fmtState.bold ? 'var(--accent-soft)' : 'none',
            color: fmtState.bold ? 'var(--accent)' : 'var(--ink2)' }}>B</button>
        <button className="fmt-btn" title="Miring (Ctrl+I)"
          onMouseDown={e => e.preventDefault()} onClick={() => applyInline('italic')}
          style={{ ...fmtBtn, fontFamily: "'Lora',serif", fontSize: '.85rem', fontStyle: 'italic',
            background: fmtState.italic ? 'var(--accent-soft)' : 'none',
            color: fmtState.italic ? 'var(--accent)' : 'var(--ink2)' }}>I</button>
        <button className="fmt-btn" title="Garis Bawah (Ctrl+U)"
          onMouseDown={e => e.preventDefault()} onClick={() => applyInline('underline')}
          style={{ ...fmtBtn, fontFamily: "'Lora',serif", fontSize: '.85rem', textDecoration: 'underline',
            background: fmtState.underline ? 'var(--accent-soft)' : 'none',
            color: fmtState.underline ? 'var(--accent)' : 'var(--ink2)' }}>U</button>
        <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 3px' }} />
        {(['left','center','right','justify'] as const).map(al => (
          <button key={al} className="fmt-btn"
            title={al === 'left' ? 'Rata kiri (Ctrl+L)' : al === 'center' ? 'Tengah (Ctrl+E)' : al === 'right' ? 'Rata kanan (Ctrl+R)' : 'Rata kanan-kiri (Ctrl+J)'}
            onMouseDown={e => e.preventDefault()} onClick={() => applyTextAlign(al)}
            style={{ ...fmtBtn,
              background: fmtState.align === al ? 'var(--accent-soft)' : 'none',
              color: fmtState.align === al ? 'var(--accent)' : 'var(--ink2)' }}>
            <AlignIcon align={al} />
          </button>
        ))}
        <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 3px' }} />
        <button className="fmt-btn" title={isRecording ? 'Stop recording' : 'Voice to text'}
          onMouseDown={e => e.preventDefault()} onClick={toggleVoice}
          style={{ ...fmtBtn, fontSize: '1rem', padding: '3px 7px',
            background: isRecording ? 'var(--accent-soft)' : 'none',
            color: isRecording ? 'var(--accent)' : 'var(--ink2)',
            animation: isRecording ? 'mic-pulse 1.2s ease-in-out infinite' : 'none' }}>
          🎙️
        </button>
      </div>

      {blocks.map((block, i) => {
        if (block.type === 'image') {
          const imgSize = block.size || 'full';
          const imgAlign = block.align || 'left';
          const sizeW: Record<string, string> = { sm: '40%', md: '65%', lg: '85%', full: '100%' };
          const marginMap: Record<string, string> = { left: '0 auto 0 0', center: '0 auto', right: '0 0 0 auto' };
          const btnBase: React.CSSProperties = { padding: '3px 7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.68rem', fontWeight: 600, transition: 'background .15s' };
          return (
            <div key={`${i}-img`} className="img-blk" style={{ margin: '12px 0' }}>
              <div style={{ position: 'relative', display: 'block', width: sizeW[imgSize], margin: marginMap[imgAlign], borderRadius: 12, overflow: 'hidden', background: 'var(--line)' }}>
                <img src={block.url} alt="" style={{ width: '100%', display: 'block', borderRadius: 12, maxHeight: 480, objectFit: 'cover' }} />
                <div className="blk-ctrl" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                  <button onClick={() => moveMedia(i, -1)} disabled={i === 0} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                  <button onClick={() => moveMedia(i, 1)} disabled={i === blocks.length - 1} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                  <button onClick={() => del(i)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(180,60,40,.7)', color: '#fff', cursor: 'pointer', fontSize: '.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div className="blk-ctrl" style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => triggerImageReplace(i)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(0,0,0,.4)', color: '#fff', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem' }}>📷 Ganti</button>
                  {/* Size */}
                  <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,.35)', borderRadius: 7, padding: '2px 3px' }}>
                    {(['sm','md','lg','full'] as const).map(sz => (
                      <button key={sz} onClick={() => setSize(i, sz)} style={{ ...btnBase, background: imgSize === sz ? 'rgba(255,255,255,.85)' : 'transparent', color: imgSize === sz ? '#333' : '#ddd' }}>
                        {sz === 'sm' ? 'S' : sz === 'md' ? 'M' : sz === 'lg' ? 'L' : '⬛'}
                      </button>
                    ))}
                  </div>
                  {/* Align — only useful when not full width */}
                  {imgSize !== 'full' && (
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,.35)', borderRadius: 7, padding: '2px 3px' }}>
                      {(['left','center','right'] as const).map(al => (
                        <button key={al} onClick={() => setAlign(i, al)} style={{ ...btnBase, background: imgAlign === al ? 'rgba(255,255,255,.85)' : 'transparent', color: imgAlign === al ? '#333' : '#ddd' }}>
                          {al === 'left' ? '⇤' : al === 'center' ? '↔' : '⇥'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
        if (block.type === 'gallery') {
          const g = block;
          const colsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: `repeat(${g.cols}, 1fr)`, gap: 6, borderRadius: 12, overflow: 'hidden' };
          const btnTiny: React.CSSProperties = { width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,.5)', color: '#fff', cursor: 'pointer', fontSize: '.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' };
          const btnPill: React.CSSProperties = { padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '.68rem', fontWeight: 600 };
          return (
            <div key={`${i}-gallery`} className="img-blk" style={{ margin: '12px 0' }}>
              <div style={colsStyle}>
                {g.urls.map((url, j) => (
                  <div key={j} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'var(--line)' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div className="blk-ctrl" style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 3 }}>
                      <button onClick={() => { pendingMode.current = { mode: 'gallery-replace', at: i, idx: j }; fileRef.current?.click(); }} style={btnTiny} title="Ganti foto">↺</button>
                      <button onClick={() => { const urls = g.urls.filter((_,k)=>k!==j); const nb=[...localBlocksRef.current]; nb[i]={...g,urls}; emit(nb); }} style={{ ...btnTiny, background: 'rgba(180,60,40,.6)' }} title="Hapus foto">✕</button>
                    </div>
                  </div>
                ))}
                {uploadingAt === i && (
                  <div style={{ borderRadius: 8, background: 'var(--line)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'var(--ink3)' }}>...</span>
                  </div>
                )}
                <button onClick={() => triggerGalleryAdd(i)} style={{ borderRadius: 8, background: 'var(--line)', aspectRatio: '1', border: '1.5px dashed var(--ink3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: '1.2rem' }}>+</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 3, background: 'var(--line)', borderRadius: 7, padding: '3px 4px' }}>
                  {([2,3] as const).map(c => (
                    <button key={c} onClick={() => { const nb=[...localBlocksRef.current]; nb[i]={...g,cols:c}; emit(nb); }} style={{ ...btnPill, background: g.cols===c ? 'var(--accent)' : 'transparent', color: g.cols===c ? '#fff' : 'var(--ink3)' }}>{c} kolom</button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button onClick={() => moveMedia(i, -1)} disabled={i===0} style={{ ...btnTiny, background: 'var(--line)', color: 'var(--ink3)' }}>↑</button>
                  <button onClick={() => moveMedia(i, 1)} disabled={i===blocks.length-1} style={{ ...btnTiny, background: 'var(--line)', color: 'var(--ink3)' }}>↓</button>
                  <button onClick={() => del(i)} style={{ ...btnTiny, background: 'rgba(180,60,40,.12)', color: '#C27054' }}>✕</button>
                </div>
              </div>
            </div>
          );
        }
        if (block.type === 'todo') {
          return (
            <div key={`${i}-todo`} className="blk-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
              <button onClick={() => { const nb = [...localBlocksRef.current]; nb[i] = { ...block, done: !block.done }; emit(nb); }} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: `2px solid ${block.done ? 'var(--accent)' : 'var(--ink3)'}`, background: block.done ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                {block.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
              <input ref={el => { refs.current[i] = el; }} value={block.content}
                onFocus={() => setFocusedIdx(i)}
                onChange={e => { const nb = [...localBlocksRef.current]; nb[i] = { ...block, content: e.target.value }; emit(nb); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); const nb = [...localBlocksRef.current]; nb.splice(i + 1, 0, { type: 'todo', done: false, content: '' }); emit(nb); focusAt(i + 1); }
                  if (e.key === 'Backspace' && !block.content) { e.preventDefault(); const nb = localBlocksRef.current.filter((_, j) => j !== i); emit(nb); focusAt(Math.max(0, i - 1)); }
                }}
                style={{ flex: 1, fontFamily: ff, fontSize: `${fz}rem`, lineHeight: 2.1, color: block.done ? 'var(--ink3)' : 'var(--ink)', textDecoration: block.done ? 'line-through' : 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0 }}
              />
              <BlockControls i={i} />
            </div>
          );
        }
        // link preview block
        if (block.type === 'link') {
          let hostname = '';
          try { hostname = new URL(block.url).hostname; } catch(_) {}
          return (
            <div key={`${i}-link`} className="img-blk" style={{ margin: '10px 0', position: 'relative' }}>
              <a href={block.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg)', textDecoration: 'none', color: 'inherit', transition: 'box-shadow .2s', overflow: 'hidden' }}>
                {block.image && (
                  <img src={block.image} alt="" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    {block.favicon && <img src={block.favicon} alt="" style={{ width: 13, height: 13, borderRadius: 2, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <span style={{ fontSize: '.68rem', color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hostname}</span>
                  </div>
                  <div style={{ fontFamily: ff, fontSize: '.88rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.title || block.url}</div>
                  {block.description && <div style={{ fontSize: '.76rem', color: 'var(--ink2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{block.description}</div>}
                </div>
              </a>
              <div className="blk-ctrl" style={{ position: 'absolute', top: 6, right: 6 }}>
                <button onClick={() => del(i)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(180,60,40,.7)', color: '#fff', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>
          );
        }
        // table block
        if (block.type === 'table') {
          const updateCell = (r: number, c: number, val: string) => {
            const nb = [...localBlocksRef.current];
            const newRows = block.rows.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? val : cell));
            nb[i] = { type: 'table', rows: newRows };
            emit(nb);
          };
          const addRow = () => { const nb = [...localBlocksRef.current]; nb[i] = { type: 'table', rows: [...block.rows, Array(block.rows[0]?.length||1).fill('')] }; emit(nb); };
          const addCol = () => { const nb = [...localBlocksRef.current]; nb[i] = { type: 'table', rows: block.rows.map(r => [...r, '']) }; emit(nb); };
          const delRow = (r: number) => { if (block.rows.length <= 1) return; const nb = [...localBlocksRef.current]; nb[i] = { type: 'table', rows: block.rows.filter((_,ri) => ri !== r) }; emit(nb); };
          const delCol = (c: number) => { if ((block.rows[0]?.length||0) <= 1) return; const nb = [...localBlocksRef.current]; nb[i] = { type: 'table', rows: block.rows.map(r => r.filter((_,ci) => ci !== c)) }; emit(nb); };
          const cols = block.rows[0]?.length || 1;
          return (
            <div key={`${i}-table`} className="img-blk" style={{ margin: '10px 0', overflowX: 'auto', position: 'relative' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: ff, fontSize: `${fz * 0.9}rem` }}>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} style={{ border: '1px solid var(--line)', padding: 0, minWidth: 100, position: 'relative', verticalAlign: 'top' }}>
                          <textarea
                            value={cell}
                            rows={1}
                            onChange={e => updateCell(r, c, e.target.value)}
                            style={{ width: '100%', padding: '7px 8px', border: 'none', outline: 'none', background: r === 0 ? 'var(--bg)' : 'transparent', fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--ink)', fontWeight: r === 0 ? 600 : 400, boxSizing: 'border-box' as const, resize: 'vertical', overflow: 'auto', lineHeight: '1.6', display: 'block', minHeight: 34 }}
                          />
                          {r === 0 && (
                            <button onClick={() => delCol(c)} className="blk-ctrl" title="Hapus kolom" style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 4, border: 'none', background: 'rgba(180,60,40,.65)', color: '#fff', cursor: 'pointer', fontSize: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                          )}
                        </td>
                      ))}
                      <td style={{ border: 'none', padding: '0 4px' }}>
                        <button onClick={() => delRow(r)} className="blk-ctrl" title="Hapus baris" style={{ width: 18, height: 18, borderRadius: 5, border: 'none', background: 'rgba(180,60,40,.55)', color: '#fff', cursor: 'pointer', fontSize: '.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={addRow} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'var(--ink3)' }}>+ Baris</button>
                <button onClick={addCol} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'var(--ink3)' }}>+ Kolom</button>
                <button onClick={() => del(i)} style={{ border: '1px dashed rgba(180,60,40,.4)', background: 'none', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'rgba(180,60,40,.7)' }}>Hapus tabel</button>
              </div>
              {/* Click area to add a text block below the table */}
              <div
                onClick={() => {
                  const nextBlock = localBlocksRef.current[i + 1];
                  if (nextBlock?.type === 'text') { focusAt(i + 1); return; }
                  const nb = [...localBlocksRef.current];
                  nb.splice(i + 1, 0, { type: 'text', content: '' });
                  emit(nb);
                  setTimeout(() => focusAt(i + 1), 30);
                }}
                style={{ marginTop: 2, height: 36, cursor: 'text', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 4 }}
              />
            </div>
          );
        }
        // text block
        return (
          <div key={`${i}-text`} className="blk-wrap" style={{ position: 'relative' }}>
            <div
              ref={el => {
                refs.current[i] = el;
                // Skip DOM reset only for the block being actively typed (debounce window)
                const isTypingHere = i === focusedIdx && onChangeDebouncedRef.current !== null;
                if (el && !isTypingHere) {
                  const content = block.content || '';
                  const prevLast = el.getAttribute('data-last');
                  if (prevLast !== content) {
                    el.innerHTML = normalizePlainToHtml(content);
                    el.setAttribute('data-last', content);
                    if (autoFocus && i === 0 && prevLast === null) { setTimeout(() => { el.focus(); const r = document.createRange(); const s = window.getSelection(); r.selectNodeContents(el); r.collapse(false); s?.removeAllRanges(); s?.addRange(r); }, 30); }
                  }
                }
              }}
              contentEditable
              suppressContentEditableWarning
              data-placeholder={i === 0 ? placeholder : ''}
              onFocus={() => { setFocusedIdx(i); syncFmt(); }}
              onMouseUp={() => { syncFmt(); setTimeout(updateSelToolbar, 10); }}
              onKeyUp={e => {
                syncFmt();
                if (e.key.length !== 1 || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) updateSelToolbar();
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  const range = sel.getRangeAt(0);
                  const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || "";

                  // 1. Slash command detection
                  if (e.key === '/') {
                    // Detect if '/' is at start of line or after space
                    const isTrigger = textBefore.trim() === '/' || textBefore.endsWith(' /');
                    if (isTrigger && editorRef.current) {
                      const rect = range.getBoundingClientRect();
                      const parentRect = editorRef.current.getBoundingClientRect();
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const menuH = 280;
                      const showAbove = spaceBelow < menuH;
                      
                      setSlash({ 
                        visible: true, 
                        mode: 'command',
                        query: '', 
                        selected: 0, 
                        idx: i, 
                        x: rect.left - parentRect.left, 
                        y: showAbove 
                          ? (rect.top - parentRect.top - menuH - 8) 
                          : (rect.bottom - parentRect.top + 4)
                      });
                    }
                  } else if (slash.visible) {
                    const lastSlash = textBefore.lastIndexOf('/');
                    if (lastSlash !== -1) setSlash(s => ({ ...s, query: textBefore.slice(lastSlash + 1) }));
                    else setSlash(s => ({ ...s, visible: false }));
                  }

                  // 2. Auto-format (on Space)
                  if (e.key === ' ' && block.type === 'text') {
                    // Check if we are at the start of a line/block
                    // Simple check for start of block text
                    if (textBefore === '- ' || textBefore === '* ' || textBefore === '[] ') {
                      // Convert current text block to todo if mostly empty, or insert todo
                      const el = refs.current[i] as HTMLDivElement;
                      const plain = el.textContent || "";
                      if (plain === textBefore) {
                        const nb = [...localBlocksRef.current];
                        nb[i] = { type: 'todo', done: false, content: '' };
                        emit(nb);
                        setTimeout(() => focusAt(i), 30);
                      }
                    } else if (textBefore === '1. ') {
                      const el = refs.current[i] as HTMLDivElement;
                      if ((el.textContent || "") === textBefore) {
                        el.innerHTML = "";
                        document.execCommand('insertOrderedList', false);
                        captureHtml(i);
                      }
                    } else if (textBefore === '# ' || textBefore === '## ' || textBefore === '### ') {
                      const el = refs.current[i] as HTMLDivElement;
                      if ((el.textContent || "") === textBefore) {
                         const level = textBefore.trim().length;
                         el.innerHTML = "";
                         applyHeading(level);
                      }
                    }
                  }
                }
              }}
              onSelect={() => { syncFmt(); updateSelToolbar(); }}
              onKeyDown={e => {
                // Alt+1/2/3/4 → Heading levels
                if (e.altKey && !e.ctrlKey && !e.metaKey) {
                  if (e.key === '1') { e.preventDefault(); applyHeading(1); return; }
                  if (e.key === '2') { e.preventDefault(); applyHeading(2); return; }
                  if (e.key === '3') { e.preventDefault(); applyHeading(3); return; }
                  if (e.key === '4') { e.preventDefault(); applyHeading(4); return; }
                }
                if (slash.visible) {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const dir = e.shiftKey ? -1 : 1;
                    setSlash(s => ({ ...s, selected: (s.selected + dir + filteredOptions.length) % filteredOptions.length }));
                    return;
                  }
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSlash(s => ({ ...s, selected: (s.selected + 1) % filteredOptions.length })); return; }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSlash(s => ({ ...s, selected: (s.selected - 1 + filteredOptions.length) % filteredOptions.length })); return; }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const opt = filteredOptions[slash.selected];
                    if (opt) execSlashCommand(opt.id, i);
                    return;
                  }
                  if (e.key === 'Escape') { e.preventDefault(); setSlash(s => ({ ...s, visible: false })); return; }
                }

                // Tab → indent (4 spaces) — only if slash menu is NOT visible
                if (e.key === 'Tab') {
                  e.preventDefault();
                  document.execCommand('insertText', false, '    ');
                  captureHtml(i);
                  return;
                }

                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                  // Handle list continuation inside text blocks
                  const sel = window.getSelection();
                  if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    const el = refs.current[i] as HTMLDivElement;
                    
                    // Get current line's text up to selection
                    let lineContainer: Node | null = range.startContainer;
                    while (lineContainer && lineContainer.parentNode !== el && lineContainer !== el) {
                      lineContainer = lineContainer.parentNode;
                    }
                    
                    const lineText = (lineContainer?.textContent || "").replace(/\u00A0/g, ' ');
                    const bulletMatch = lineText.match(/^(\s*)([-*•])\s/);
                    const numberMatch = lineText.match(/^(\s*)(\d+)\.\s/);
                    
                    if (bulletMatch || numberMatch) {
                      const isEmpty = bulletMatch ? lineText.trim() === bulletMatch[2] : lineText.trim() === numberMatch![2] + ".";
                      if (isEmpty) {
                        e.preventDefault();
                        if (lineContainer) (lineContainer as HTMLElement).innerText = "";
                        captureHtml(i);
                        return;
                      }

                      e.preventDefault();
                      const nextPrefix = bulletMatch 
                        ? `${bulletMatch[1]}${bulletMatch[2]} ` 
                        : `${numberMatch![1]}${parseInt(numberMatch![2]) + 1}. `;
                      
                      document.execCommand('insertLineBreak');
                      document.execCommand('insertText', false, nextPrefix);
                      captureHtml(i);
                      return;
                    }
                  }
                }
                if (e.ctrlKey || e.metaKey) {
                  // Undo / Redo
                  if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); undoHistory(); return; }
                  if ((e.key === 'z' || e.key === 'Z') && e.shiftKey)  { e.preventDefault(); redoHistory(); return; }
                  if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); redoHistory(); return; }
                  // Done writing
                  if (e.key === 'Enter') { e.preventDefault(); onDone?.(); return; }
                  // Inline code  Ctrl+`
                  if (e.key === '`') { e.preventDefault(); wrapSelection('code'); return; }
                  // Insert link  Ctrl+K
                  if (e.key === 'k' || e.key === 'K') {
                    e.preventDefault();
                    const url = window.prompt('Masukkan URL:', 'https://');
                    if (url?.trim()) wrapSelection('a', url.trim());
                    return;
                  }
                  // Strikethrough  Ctrl+Shift+S
                  if ((e.key === 's' || e.key === 'S') && e.shiftKey) { e.preventDefault(); wrapSelection('s'); return; }
                  // Bold / Italic / Underline
                  if (e.key === 'b' || e.key === 'B') { e.preventDefault(); applyInline('bold'); }
                  else if (e.key === 'i' || e.key === 'I') { e.preventDefault(); applyInline('italic'); }
                  else if (e.key === 'u' || e.key === 'U') { e.preventDefault(); applyInline('underline'); }
                  // Align
                  else if (e.key === 'l' || e.key === 'L') { e.preventDefault(); applyTextAlign('left'); }
                  else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); applyTextAlign('center'); }
                  else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); applyTextAlign('right'); }
                  else if (e.key === 'j' || e.key === 'J') { e.preventDefault(); applyTextAlign('justify'); }
                }
              }}
              onPaste={e => {
                const items = Array.from(e.clipboardData?.items || []);
                // 1. image paste
                const imgItem = items.find(it => it.type.startsWith('image/'));
                if (imgItem) {
                  e.preventDefault();
                  const file = imgItem.getAsFile();
                  if (!file) return;
                  captureSplit(i);
                  handlePasteImage(file, i);
                  return;
                }
                // 2. URL paste → link preview (check BEFORE html, using sync getData)
                const plainText = e.clipboardData?.getData('text/plain') || '';
                const trimmed = plainText.trim();
                let isUrl = false;
                try { const u = new URL(trimmed); isUrl = u.protocol === 'http:' || u.protocol === 'https:'; } catch(_) {}
                if (isUrl) {
                  e.preventDefault();
                  captureSplit(i);
                  const split = savedSplitRef.current; savedSplitRef.current = null;
                  const placeholder: Block = { type: 'link', url: trimmed, title: trimmed, description: '', image: '', favicon: '' };
                  const nb3 = [...localBlocksRef.current];
                  if (split && split.at === i && nb3[i]?.type === 'text') {
                    nb3[i] = { type: 'text', content: split.before };
                    nb3.splice(i + 1, 0, placeholder);
                    const afterContent = split.after.replace(/<br\s*\/?>/gi, '').trim();
                    if (afterContent) nb3.splice(i + 2, 0, { type: 'text', content: split.after });
                  } else {
                    nb3.splice(i + 1, 0, placeholder);
                  }
                  emit(nb3);
                  fetchLinkPreview(trimmed, nb3);
                  return;
                }
                // 4. Markdown paste (processed asynchronously, with size guard)
                const MAX_MD_LENGTH = 8000; // threshold to avoid heavy parsing
                if (quickLooksLikeMarkdown(plainText)) {
                  if (plainText.length > MAX_MD_LENGTH) {
                    // Too large: treat as plain text to avoid heavy markdown parsing
                    e.preventDefault();
                    captureSplit(i);
                    const split = savedSplitRef.current; savedSplitRef.current = null;
                    const nb = [...localBlocksRef.current];
                    if (split && split.at === i && nb[i]?.type === 'text') {
                      nb[i] = { type: 'text', content: split.before };
                      nb.splice(i + 1, 0, { type: 'text', content: plainText });
                      const afterContent = split.after.replace(/<br\s*\/?>/gi, '').trim();
                      if (afterContent) nb.splice(i + 2, 0, { type: 'text', content: afterContent });
                    } else {
                      nb.splice(i + 1, 0, { type: 'text', content: plainText });
                    }
                    emit(nb);
                    focusAt(i + 1);
                    return;
                  }
                  // Normal markdown processing
                  e.preventDefault();
                  captureSplit(i);
                  const split = savedSplitRef.current; savedSplitRef.current = null;
                  setTimeout(() => {
                    const mdBlocks = markdownToBlocks(plainText);
                    const nb4 = [...localBlocksRef.current];
                    let focusIdx = i + mdBlocks.length;
                    if (split && split.at === i && nb4[i]?.type === 'text') {
                      nb4[i] = { type: 'text', content: split.before };
                      nb4.splice(i + 1, 0, ...mdBlocks);
                      const afterContent = split.after.replace(/<br\s*\/?>/gi, '').trim();
                      if (afterContent) nb4.splice(i + 1 + mdBlocks.length, 0, { type: 'text', content: split.after });
                    } else {
                      nb4.splice(i + 1, 0, ...mdBlocks);
                    }
                    emit(nb4);
                    focusAt(focusIdx);
                  }, 0);
                  return;
                }
                // 5. HTML table paste (sync getData)
                const htmlContent = e.clipboardData?.getData('text/html') || '';
                if (htmlContent) {
                  const div = document.createElement('div');
                  div.innerHTML = htmlContent;
                  const table = div.querySelector('table');
                  if (table) {
                    e.preventDefault();
                    const tableRows: string[][] = [];
                    Array.from(table.rows).forEach(tr => {
                      const cells: string[] = [];
                      Array.from((tr as HTMLTableRowElement).cells).forEach(td => cells.push(td.textContent?.trim() || ''));
                      if (cells.length) tableRows.push(cells);
                    });
                    if (tableRows.length) {
                      const maxCols = Math.max(...tableRows.map(r => r.length));
                      const normalized = tableRows.map(r => { while (r.length < maxCols) r.push(''); return r; });
                      captureSplit(i);
                      const nb2 = [...localBlocksRef.current];
                      nb2.splice(i + 1, 0, { type: 'table', rows: normalized });
                      emit(nb2);
                    }
                    return;
                  }
                }
              }}
              onInput={e => {
                const el = e.currentTarget;
                const html = sanitizeCeHtml(el.innerHTML);
                el.setAttribute('data-last', html);
                const nb = [...localBlocksRef.current]; nb[i] = { type: 'text', content: html }; emit(nb, true);
              }}
              onBlur={e => {
                const plain = (e.currentTarget.textContent || '').trim();
                let isUrl = false;
                try { const u = new URL(plain); isUrl = u.protocol === 'http:' || u.protocol === 'https:'; } catch(_) {}
                if (isUrl) {
                  const placeholder: Block = { type: 'link', url: plain, title: plain, description: '', image: '', favicon: '' };
                  const nb = [...localBlocksRef.current];
                  nb[i] = placeholder;
                  emit(nb);
                  fetchLinkPreview(plain, nb);
                }
              }}
              className="blk-ce"
              style={{ width: '100%', outline: 'none', background: 'transparent', fontFamily: ff, fontSize: `${fz}rem`, lineHeight: 2.1, color: 'var(--ink)', minHeight: block.content && block.content !== '<br>' ? undefined : '220px', wordBreak: 'break-word', paddingRight: blocks.length > 1 ? 72 : 0 }}
            />
            {blocks.length > 1 && (
              <div style={{ position: 'absolute', top: 6, right: 0, display: 'flex', gap: 2, alignItems: 'center' }}>
                <BlockControls i={i} />
              </div>
            )}
            {/* Insert media below this text block */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              {uploadingAt === i ? (
                <span style={{ fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', padding: '3px 0' }}>Mengunggah…</span>
              ) : linkLoading ? (
                <span style={{ fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', padding: '3px 0' }}>Mengambil preview…</span>
              ) : (
                <>
                  <button
                    onMouseDown={() => captureSplit(i)}
                    onClick={() => triggerImageAt(i)}
                    style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                    📷 Foto
                  </button>
                  <button onClick={() => triggerGalleryNew(i)} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                    ⊞ Grid
                  </button>
                  <button onClick={() => { captureSplit(i); const nb = [...localBlocksRef.current]; nb.splice(i + 1, 0, { type: 'table', rows: [['','',''],['','','']] }); emit(nb); }} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                    ⊟ Tabel
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
      {slash.visible && (
        <div style={{
          position: 'absolute', 
          top: slash.y, 
          left: Math.max(0, Math.min(600, slash.x)),
          zIndex: 10000, 
          background: 'var(--surface)', 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--line)',
          borderRadius: 14, 
          boxShadow: '0 12px 48px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.05)',
          padding: 6, 
          minWidth: 220, 
          maxWidth: 300,
          maxHeight: 280,
          overflowY: 'auto',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1,
          fontFamily: ff,
          animation: 'fadeUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) both'
        }} ref={slashMenuRef}>
          <style>{`.blk-ce::-webkit-scrollbar{width:4px}.blk-ce::-webkit-scrollbar-thumb{background:var(--line);border-radius:10px}`}</style>
          {filteredOptions.length === 0 && <div style={{ padding: '8px 12px', fontSize: '.8rem', color: 'var(--ink3)' }}>Tidak ada hasil</div>}
          {filteredOptions.map((opt, idx) => {
             const isSel = slash.selected === idx;
             return (
               <div key={opt.id} data-slash-item onMouseDown={(e) => e.preventDefault()} onClick={() => execSlashCommand(opt.id, slash.idx)}
                 onMouseEnter={() => setSlash(s => ({ ...s, selected: idx }))}
                 style={{
                   display: 'flex', alignItems: 'center', gap: 12, padding: '7px 12px', borderRadius: 8,
                   cursor: 'pointer', background: isSel ? 'var(--accent-soft)' : 'transparent',
                   color: isSel ? 'var(--accent)' : 'var(--ink)'
                 }}>
                 <div style={{ width: 28, height: 28, borderRadius: 6, background: isSel ? 'var(--bg)' : 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: opt.id.startsWith('h') ? '.75rem' : '1rem', fontWeight: 700 }}>{opt.icon}</div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                   <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{opt.label}</span>
                   <span style={{ fontSize: '.68rem', opacity: .5 }}>{opt.sub}</span>
                 </div>
               </div>
             );
          })}
        </div>
      )}

      {/* ── Floating selection toolbar ── */}
      {selToolbar.visible && typeof document !== 'undefined' && createPortal((() => {
        const BG = '#18181b';
        const DIVIDER = 'rgba(255,255,255,.12)';
        const sBtn = (active: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
          border: 'none',
          background: active ? 'rgba(255,255,255,.18)' : 'transparent',
          color: active ? '#fff' : 'rgba(255,255,255,.72)',
          cursor: 'pointer',
          borderRadius: 5,
          padding: '5px 5px',
          lineHeight: 1,
          transition: 'background .1s, color .1s',
          flexShrink: 0,
          ...extra,
        });
        const sep = <div style={{ width: 1, alignSelf: 'stretch', background: DIVIDER, margin: '4px 2px', flexShrink: 0 }} />;
        const availW = Math.min(SELTOOLBAR_W, window.innerWidth - 16);
        // availW is the actual rendered width, matching the clamped left-edge calc above
        return (
          <>
            <style>{`[data-sel-toolbar]::-webkit-scrollbar{display:none}`}</style>
            <div data-sel-toolbar ref={selToolbarRef} style={{
              position: 'fixed',
              ...(selToolbar.showAbove
                ? { bottom: selToolbar.y }
                : { top: selToolbar.y }),
              left: selToolbar.x,
              zIndex: 9999,
              background: BG,
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,.4), 0 1px 3px rgba(0,0,0,.3)',
              padding: '2px 3px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap' as const,
              gap: 0,
              userSelect: 'none' as const,
              overflowX: 'auto' as const,
              scrollbarWidth: 'none' as any,
              msOverflowStyle: 'none' as any,
              maxWidth: `${availW}px`,
              animation: 'fadeUp 0.12s cubic-bezier(0.16,1,0.3,1) both',
            }}>
              {/* Arrow pointing at selection */}
              <div style={{
                position: 'absolute',
                [selToolbar.showAbove ? 'bottom' : 'top']: -6,
                left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                [selToolbar.showAbove ? 'borderTop' : 'borderBottom']: `6px solid ${BG}`,
                pointerEvents: 'none',
              }} />

              {/* Inline format group */}
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>applyInline('bold')} title="Tebal (Ctrl+B)"
                style={{...sBtn(fmtState.bold), fontFamily:"'Lora',serif", fontWeight:700, fontSize:'.82rem'}}>B</button>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>applyInline('italic')} title="Miring (Ctrl+I)"
                style={{...sBtn(fmtState.italic), fontFamily:"'Lora',serif", fontStyle:'italic', fontWeight:600, fontSize:'.82rem'}}>I</button>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>applyInline('underline')} title="Garis bawah (Ctrl+U)"
                style={{...sBtn(fmtState.underline), fontFamily:"'Lora',serif", textDecoration:'underline', fontWeight:600, fontSize:'.82rem'}}>U</button>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>wrapSelection('s')} title="Coret"
                style={{...sBtn(fmtState.strike), fontFamily:"'Lora',serif", textDecoration:'line-through', fontWeight:600, fontSize:'.82rem'}}>S</button>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>wrapSelection('code')} title="Kode inline"
                style={{...sBtn(fmtState.code), fontFamily:'monospace', fontWeight:600, fontSize:'.72rem', letterSpacing:'-.02em'}}>{'</>'}</button>

              {sep}

              {/* Heading group */}
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>applyHeading(1)} title="Heading 1"
                style={{...sBtn(false), fontFamily:"'Lora',serif", fontWeight:700, fontSize:'.72rem'}}>H1</button>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>applyHeading(2)} title="Heading 2"
                style={{...sBtn(false), fontFamily:"'Lora',serif", fontWeight:700, fontSize:'.72rem'}}>H2</button>
              <button onMouseDown={e=>e.preventDefault()} onClick={()=>applyHeading(3)} title="Heading 3"
                style={{...sBtn(false), fontFamily:"'Lora',serif", fontWeight:700, fontSize:'.72rem'}}>H3</button>

              {sep}

              {/* Align group */}
              {(['left','center','right','justify'] as const).map(al => (
                <button key={al} onMouseDown={e=>e.preventDefault()} onClick={()=>applyTextAlign(al)}
                  title={al==='left'?'Rata kiri':al==='center'?'Tengah':al==='right'?'Rata kanan':'Rata penuh'}
                  style={{...sBtn(fmtState.align===al), padding:'5px 4px'}}>
                  <AlignIcon align={al} />
                </button>
              ))}
            </div>
          </>
        );
      })(), document.body)}
    </div>
  );
});

// ─────────────── Streak Components ───────────────

const STREAK_MILESTONES = [
  { days: 3,   badge: "🌱", label: "Mulai tumbuh" },
  { days: 7,   badge: "⭐", label: "1 minggu!" },
  { days: 14,  badge: "🔥", label: "2 minggu!" },
  { days: 30,  badge: "💎", label: "1 bulan!" },
  { days: 100, badge: "👑", label: "100 hari!" },
];

function getMilestone(days: number) {
  return [...STREAK_MILESTONES].reverse().find(m => days >= m.days) || null;
}

function getFlamePalette(streak: number, status: "active" | "at_risk" | "broken") {
  if (status === "broken") return { outerTop:"#9DB3C4", outerMid:"#B0C4CE", outerBot:"#CDD9E0", innerTop:"#B8CACF", innerBot:"#DCE8EC", glow:"none" };
  const isAt = status === "at_risk";
  // Milestones: <5 default orange, 5+ yellow-orange, 25+ amber, 50+ red-gold, 100+ purple-gold, 200+ rainbow
  if (streak >= 200) return { outerTop:isAt?"#9B4DCA":"#C84BFF", outerMid:isAt?"#E066B0":"#FF69D4", outerBot:isAt?"#F0B030":"#FFD700", innerTop:isAt?"#F5D060":"#FFEF80", innerBot:"#FFF8B0", glow:`rgba(200,75,255,.65)` };
  if (streak >= 100) return { outerTop:isAt?"#8B3A9A":"#A020F0", outerMid:isAt?"#C060D0":"#C84BE8", outerBot:isAt?"#D4A020":"#E8C030", innerTop:isAt?"#E8D050":"#F8E870", innerBot:"#FFFAB0", glow:`rgba(160,32,240,.55)` };
  if (streak >=  50) return { outerTop:isAt?"#B80000":"#FF0000", outerMid:isAt?"#CC3000":"#FF4500", outerBot:isAt?"#E0A000":"#FFC000", innerTop:isAt?"#F5C820":"#FFE040", innerBot:"#FFF7A0", glow:`rgba(255,50,0,.65)` };
  if (streak >=  25) return { outerTop:isAt?"#B84E00":"#FF6800", outerMid:isAt?"#CC7000":"#FFA000", outerBot:isAt?"#DDB820":"#FFD000", innerTop:isAt?"#F0D040":"#FFE860", innerBot:"#FFF8B0", glow:`rgba(255,120,0,.6)` };
  if (streak >=   5) return { outerTop:isAt?"#CC5800":"#FF7000", outerMid:isAt?"#D88000":"#FFB000", outerBot:isAt?"#E8C030":"#FFD700", innerTop:isAt?"#F8D850":"#FFF070", innerBot:"#FFFCB0", glow:`rgba(255,160,0,.55)` };
  // default (<5 or at_risk no milestone)
  return { outerTop:isAt?"#E07830":"#FF4500", outerMid:isAt?"#E89040":"#FF8C00", outerBot:isAt?"#F5C060":"#FFD700", innerTop:isAt?"#FADA82":"#FFD700", innerBot:isAt?"#FFF0C0":"#FFF8B0", glow:isAt?`rgba(255,160,40,.4)`:`rgba(255,140,0,.55)` };
}

function FlameSVG({ status, size = 52, streak = 0 }: { status: "active" | "at_risk" | "broken"; size?: number; streak?: number }) {
  const isBroken = status === "broken";
  const p = getFlamePalette(streak, status);
  const { outerTop, outerMid, outerBot, innerTop, innerBot, glow } = p;
  const glowFilter = isBroken ? "none" : `drop-shadow(0 0 ${Math.round(size * 0.12)}px ${glow})`;
  const animStyle: React.CSSProperties = isBroken ? {} : {
    animation: "flameFlicker 3.2s ease-in-out infinite, flamePulse 2.4s ease-in-out infinite",
  };
  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 40 52"
      fill="none"
      style={{ filter: glowFilter, transformOrigin: "center bottom", flexShrink: 0, ...animStyle }}
    >
      <defs>
        <linearGradient id="sg-outer" x1="20" y1="4" x2="20" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={outerTop} />
          <stop offset="50%"  stopColor={outerMid} />
          <stop offset="100%" stopColor={outerBot} />
        </linearGradient>
        <linearGradient id="sg-inner" x1="20" y1="18" x2="20" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={innerTop} />
          <stop offset="100%" stopColor={innerBot} />
        </linearGradient>
      </defs>
      {/* Outer flame */}
      <path
        d="M20 4 C14 8 7 16 8 26 C9 33 14 40 17 44 C18 46 19 48 20 48 C21 48 22 46 23 44 C26 40 31 33 32 26 C33 16 26 8 20 4Z"
        fill="url(#sg-outer)"
      />
      {/* Base ellipse for 3D feel */}
      <ellipse cx="20" cy="47" rx="7" ry="2.5" fill={outerBot} opacity="0.35" />
      {/* Inner flame */}
      <path
        d="M20 18 C17 22 15 27 16 33 C17 37 18.5 41 20 46 C21.5 41 23 37 24 33 C25 27 23 22 20 18Z"
        fill="url(#sg-inner)"
        opacity="0.88"
      />
      {/* Bright core highlight */}
      <ellipse cx="19.5" cy="36" rx="2.2" ry="4.5" fill="white" opacity={isBroken ? "0" : "0.2"} />
    </svg>
  );
}

function MilestoneBurst() {
  const particles = ["✨", "⭐", "✨", "🌟", "✨", "⭐", "✨", "🌟"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {particles.map((p, i) => {
        const angle = (i / particles.length) * 360;
        return (
          <span key={i} style={{
            position: "absolute",
            fontSize: i % 2 === 0 ? "1rem" : ".75rem",
            animation: `sparkle 1.8s cubic-bezier(.16,1,.3,1) ${i * 0.08}s both`,
            transform: `rotate(${angle}deg) translateY(-20px)`,
            transformOrigin: "center",
          }}>{p}</span>
        );
      })}
    </div>
  );
}


const hasContent = (e: any) => {
  const t = (e.text || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
  return !!t || !!(e.title || '').trim() || !!e.isLocked;
};

// ─────────────────────────────────────────────────
// Leaflet module-level cache so we only import once
let leafletPromise: Promise<any> | null = null;
let L_MOD: any = null;
function preloadLeaflet() {
  if (!leafletPromise) leafletPromise = import("leaflet");
}
function applyMapThemeStyle(isDark: boolean) {
  const popBg    = isDark ? "#1E1C1A" : "#FFFFFF";
  const popBdr   = isDark ? "#3A3633" : "#EDE9E3";
  const popTitle = isDark ? "#EDE9E3" : "#222";
  const styleId  = "leaflet-popup-theme";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) { styleEl = document.createElement("style"); styleEl.id = styleId; document.head.appendChild(styleEl); }
  styleEl.textContent = isDark
    ? `.leaflet-popup-content-wrapper{background:${popBg}!important;border:1px solid ${popBdr}!important;box-shadow:0 4px 20px rgba(0,0,0,.5)!important;color:${popTitle}!important;border-radius:12px!important}.leaflet-popup-tip{background:${popBg}!important}.leaflet-popup-content{margin:10px 14px!important}`
    : `.leaflet-popup-content-wrapper{background:${popBg}!important;border:1px solid ${popBdr}!important;box-shadow:0 4px 16px rgba(0,0,0,.1)!important;border-radius:12px!important}.leaflet-popup-tip{background:${popBg}!important}.leaflet-popup-content{margin:10px 14px!important}`;
}
function addMarkersToGroup(L: any, group: any, notes: any[], addedIds: Set<string>, isDark: boolean) {
  const pinBg    = isDark ? "#2A2724" : "#FFFFFF";
  const popDate  = isDark ? "#8A8480" : "#888";
  const popBody  = isDark ? "#A09890" : "#555";
  const popTitle = isDark ? "#EDE9E3" : "#222";
  const iconCache = new Map<string, any>();
  const getIcon = (emoji: string, color: string) => {
    const key = `${emoji}|${color}`;
    if (!iconCache.has(key)) {
      iconCache.set(key, L.divIcon({
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
        html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:${pinBg};border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:1.05rem;box-shadow:0 2px 8px rgba(0,0,0,${isDark ? ".4" : ".15"});transform:rotate(-45deg)"><span style="transform:rotate(45deg);line-height:1">${emoji}</span></div>`,
      }));
    }
    return iconCache.get(key);
  };
  notes.forEach((note) => {
    if (addedIds.has(note.id)) return;
    addedIds.add(note.id);
    const mood  = note.mood != null ? MOODS[note.mood] : null;
    const emoji = mood?.emoji ?? "📝";
    const color = mood?.color ?? "#C4956A";
    const title   = note.title || "Tanpa judul";
    const preview = (note.text || "").replace(/<[^>]*>/g, "").slice(0, 80).trim();
    const marker = L.marker([note.lat, note.lng], { icon: getIcon(emoji, color) });
    marker.bindPopup(
      L.popup({ maxWidth: 210, autoPan: true }).setContent(
        `<div style="font-family:'Lora',serif">` +
        `<p style="font-size:.6rem;color:${popDate};margin:0 0 2px;text-transform:uppercase;letter-spacing:.06em">${note.date}</p>` +
        `<p style="font-weight:600;margin:0 0 4px;font-size:.85rem;color:${popTitle};line-height:1.3">${title}</p>` +
        (preview ? `<p style="font-size:.72rem;color:${popBody};margin:0 0 9px;line-height:1.4">${preview}${preview.length >= 80 ? "…" : ""}</p>` : "") +
        `<button data-note-id="${note.id}" style="background:${color};color:#fff;border:none;padding:5px 13px;border-radius:8px;cursor:pointer;font-size:.72rem;font-family:'Lora',serif;font-weight:600">Buka Catatan</button>` +
        `</div>`
      )
    );
    group.addLayer(marker);
  });
}

// LeafletMap — persistent mount; parent toggles display:none/flex via CSS
function LeafletMap({ notes, mapRef, onOpenNote, isDark, isVisible }: { notes: any[]; mapRef: React.MutableRefObject<any>; onOpenNote: (id: string) => void; isDark: boolean; isVisible: boolean }) {
  const tileLayerRef = useRef<any>(null);
  const groupRef     = useRef<any>(null);
  const addedIdsRef  = useRef<Set<string>>(new Set());

  // ── Mount once ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    applyMapThemeStyle(isDark);

    const loader = leafletPromise ?? import("leaflet");
    loader.then((Lmod) => {
      const L = Lmod.default ?? Lmod;
      L_MOD = L;
      const container = document.getElementById("note-map-container");
      if (!container || (container as any)._leaflet_id) return;

      const map = L.map(container, { zoomControl: true, preferCanvas: true }).setView([0, 0], 2);

      tileLayerRef.current = L.tileLayer(
        isDark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          keepBuffer: 2,
        }
      ).addTo(map);

      groupRef.current = L.layerGroup().addTo(map);

      // Add markers that arrived before the async import resolved
      if (notes.length > 0) {
        addMarkersToGroup(L, groupRef.current, notes, addedIdsRef.current, isDark);
        const bounds: [number, number][] = notes.map((n: any) => [n.lat, n.lng]);
        try { map.fitBounds(bounds, { maxZoom: notes.length === 1 ? 14 : notes.length < 5 ? 10 : 7, padding: [40, 40] }); } catch (_) {}
      }

      map.getContainer().addEventListener("click", (e: MouseEvent) => {
        const btn = (e.target as HTMLElement).closest("[data-note-id]") as HTMLElement | null;
        if (btn) onOpenNote(btn.dataset.noteId!);
      });

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      const c = document.getElementById("note-map-container");
      if (c) delete (c as any)._leaflet_id;
      tileLayerRef.current = null;
      groupRef.current     = null;
      addedIdsRef.current  = new Set();
      L_MOD = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap tile layer on theme change ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !L_MOD) return;
    const L = L_MOD;
    applyMapThemeStyle(isDark);
    if (tileLayerRef.current) tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(
      isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        keepBuffer: 2,
      }
    ).addTo(mapRef.current);
    // Rebuild markers so pin colours update
    if (groupRef.current) { groupRef.current.clearLayers(); addedIdsRef.current = new Set(); }
    if (notes.length > 0) addMarkersToGroup(L, groupRef.current, notes, addedIdsRef.current, isDark);
  }, [isDark]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Incrementally add new markers ────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !groupRef.current || !L_MOD) return;
    const newNotes = notes.filter((n: any) => !addedIdsRef.current.has(n.id));
    if (newNotes.length === 0) return;
    addMarkersToGroup(L_MOD, groupRef.current, newNotes, addedIdsRef.current, isDark);
  }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recalc size + fit bounds when map becomes visible ────────────────────
  useEffect(() => {
    if (!isVisible || !mapRef.current) return;
    requestAnimationFrame(() => {
      if (!mapRef.current) return;
      mapRef.current.invalidateSize();
      if (notes.length > 0) {
        const bounds: [number, number][] = notes.map((n: any) => [n.lat, n.lng]);
        try {
          mapRef.current.fitBounds(bounds, { maxZoom: notes.length === 1 ? 14 : notes.length < 5 ? 10 : 7, padding: [40, 40] });
        } catch (_) {}
      }
    });
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─────────────────────────────────────────────────

const linkZettel = (h: string) => {
  if (!h) return h;
  return h.replace(/\[\[(.*?)\]\]/g, '<span class="note-link" data-note-link="$1">$1</span>');
};

export default function DiaryApp() {
  const { data: session, status } = useSession();
  const today = new Date();
  const todayStr = fmtDate(today);
  const [entries, setEntries] = useState<Record<string, any>>({});
  const csrfRef = useRef<string>("");
  const [selId, setSelId] = useState<string | null>(null);
  const [view, setView] = useState("home");
  const [cM, setCM] = useState(today.getMonth());
  const [cY, setCY] = useState(today.getFullYear());
  const [anim, setAnim] = useState("pg-in");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [infoToast, setInfoToast] = useState<string|null>(null);
  const infoToastTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const showInfoToast = useCallback((msg: string) => {
    if (infoToastTimerRef.current) clearTimeout(infoToastTimerRef.current);
    setInfoToast(msg);
    infoToastTimerRef.current = setTimeout(() => setInfoToast(null), 3000);
  }, []);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimerRef = useRef<any>(null);
  const [activeTag, setActiveTag] = useState<string|null>(null);
  const [tagInput, setTagInput] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const setFocusModeWrapper = useCallback((val: boolean) => {
    setFocusMode(val);
    if (val && typeof window !== "undefined") {
      localStorage.setItem("catatanku_focus_used", "1");
      setFocusUsed(true);
    }
  }, []);
  const [isRamadan, setIsRamadan] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [lockToast, setLockToast] = useState(false);
  const [pinLimitToast, setPinLimitToast] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [showPublicPicker, setShowPublicPicker] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [showUnlock, setShowUnlock] = useState(false);
  const [pendingNav, setPendingNav] = useState<any>(null);
  const [showShare, setShowShare] = useState(false);
  const [fontSize, setFontSize] = useState(1); // 0=small, 1=normal, 2=large
  const [lightboxUrl, setLightboxUrl] = useState<string|null>(null);
  const [showMobActions, setShowMobActions] = useState(false);
  const [showDeskMenu, setShowDeskMenu] = useState(false);
  const [showMobStyle, setShowMobStyle] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string|null>(null);
  const [dropPos, setDropPos] = useState({top:0,left:0,right:0});
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [medalToast, setMedalToast] = useState<string|null>(null);
  const [unlockedMedalIds, setUnlockedMedalIds] = useState<Set<string>>(new Set());
  const [databaseMedals, setDatabaseMedalIds] = useState<Set<string>>(new Set());
  const [focusUsed, setFocusUsed] = useState(() => typeof window !== "undefined" && localStorage.getItem("catatanku_focus_used") === "1");
  const [exportDone, setExportDone] = useState(() => typeof window !== "undefined" && localStorage.getItem("catatanku_export_done") === "1");
  const [companionType, setCompanionType] = useState<string>("none");
  const [companionName, setCompanionName] = useState<string>("");
  const [companionSaving, setCompanionSaving] = useState(false);
  const [showCompanionChat, setShowCompanionChat] = useState(true);
  const [companionMsgIdx, setCompanionMsgIdx] = useState(0);
  const [companionJustInteracted, setCompanionJustInteracted] = useState(false);
  const [petJustSaved, setPetJustSaved] = useState(false);
  const prevSavingRef = useRef(false);
  const petLastCelebratedRef = useRef(0);
  const [locationEnabled, setLocationEnabled] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("catatanku_location_enabled") === "1"
  );
  const gpsGrabbedRef = useRef<Set<string>>(new Set());
  const leafletMapRef = useRef<any>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  // Music
  const [songSearch, setSongSearch] = useState("");
  const [songResults, setSongResults] = useState<any[]>([]);
  const [songSearching, setSongSearching] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState("");
  const [ytPreview, setYtPreview] = useState<{id:string;title:string;author:string;thumbnail:string}|null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const songSearchTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Streak ──
  const [streak, setStreak] = useState<{
    currentStreak: number; longestStreak: number;
    status: "active" | "at_risk" | "broken";
  } | null>(null);
  const [streakLoaded, setStreakLoaded] = useState(false);
  const [displayedStreak, setDisplayedStreak] = useState(0);
  const [showMilestoneBurst, setShowMilestoneBurst] = useState(false);
  const prevStreakRef = useRef(0);

  // ── Import state ──
  const [importModal, setImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importConfirmModal, setImportConfirmModal] = useState(false);
  const [importError, setImportError] = useState("");
  const [selectedImportIndices, setSelectedImportIndices] = useState<Set<number>>(new Set());
  const [importOwner, setImportOwner] = useState<{name:string;email:string}|null>(null);
  const [importAllOwners, setImportAllOwners] = useState<{name:string;email:string}[]>([]);
  const [showOwnerList, setShowOwnerList] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // ── Export state ──
  const [exportConfirmModal, setExportConfirmModal] = useState(false);
  const [selectedExportIndices, setSelectedExportIndices] = useState<Set<number>>(new Set());
  const [exportData, setExportData] = useState<any[]>([]);

  const syncCloud = useCallback(async (n: Record<string, any>, updatedNote?: any, force = false) => {
    if (!updatedNote) return;
    const { id } = updatedNote;
    // Strip HTML tags/entities before checking emptiness (contenteditable can store <div><br></div>)
    const realText = (updatedNote.text || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    const realTitle = (updatedNote.title || '').trim();
    const hasContent = !!realText || !!realTitle || !!updatedNote.isLocked;

    // Auto-delete if both text and title are empty
    if (!hasContent) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (!force) {
        saveTimeoutRef.current = setTimeout(() => {
          const cur = entriesRef.current[id];
          if (!cur) return;
          const curText = (cur.text || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
          const curTitle = (cur.title || '').trim();
          if (curText || curTitle || cur.isLocked) return; // has content now, skip delete
          syncCloud(entriesRef.current, cur, true);
        }, 3000);
        return;
      }
      try { await fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfRef.current } }); } catch(e) {}
      lastSavedWordsRef.current = 0;
      return;
    }

    // Debounce cloud sync for text (15s) or force immediate (navigation/stickers)
    const words = ((updatedNote.title || "") + " " + stripHtml(updatedNote.text || "")).trim().split(/\s+/).filter(Boolean).length;
    const wordDiff = Math.abs(words - lastSavedWordsRef.current);

    if (!force && wordDiff < 10) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (!entriesRef.current[id]) return;
        syncCloud(entriesRef.current, updatedNote, true);
      }, 15000);
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    lastSavedWordsRef.current = words;
    setSaving(true);
    try {
      await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfRef.current }, body: JSON.stringify(updatedNote) });
      // Refresh streak after save
      try {
        const sr = await fetch(`/api/streak?today=${todayStr}`);
        if (sr.ok) {
          const sd = await sr.json();
          setStreak(sd);
          setStreakLoaded(true);
          const target: number = sd.currentStreak;
          if (target !== prevStreakRef.current) {
            setDisplayedStreak(target);
            prevStreakRef.current = target;
            const milestones = [3, 7, 14, 30, 100];
            if (milestones.includes(target) && sd.status === "active") {
              setShowMilestoneBurst(true);
              setTimeout(() => setShowMilestoneBurst(false), 2200);
            }
          }
        }
      } catch(e) {}
    } catch(e) {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [todayStr]);

  // ── Debounced localStorage helpers (declared before nav/upd which use them) ──
  const lsWriteTimerRef2 = useRef<ReturnType<typeof setTimeout>|null>(null);
  const lsFlush = useCallback((e: Record<string, any>) => {
    if (lsWriteTimerRef2.current) { clearTimeout(lsWriteTimerRef2.current); lsWriteTimerRef2.current = null; }
    localStorage.setItem("catatanku_entries", JSON.stringify(e));
  }, []);
  const lsSchedule = useCallback((e: Record<string, any>) => {
    if (lsWriteTimerRef2.current) clearTimeout(lsWriteTimerRef2.current);
    lsWriteTimerRef2.current = setTimeout(() => { localStorage.setItem("catatanku_entries", JSON.stringify(e)); lsWriteTimerRef2.current = null; }, 800);
  }, []);

  const nav = useCallback((v: string, id?: any) => {
    if ((v === "read" || v === "write") && id && entriesRef.current[id]?.isLocked && !unlockedIds.includes(id)) {
      setPendingNav({ v, id });
      setShowUnlock(true);
      return;
    }
    // Flush any pending localStorage write before navigating away
    lsFlush(entriesRef.current);
    // If we're leaving the write view, force a sync of the current entry
    if (view === "write" && selId && entriesRef.current[selId]) {
      syncCloud(entriesRef.current, entriesRef.current[selId], true);
    }
    setAnim("pg-out");
    setTimeout(() => {
      if (id !== undefined) setSelId(id);
      setView(v); setShowSearch(false); setQ(""); setShowStickers(false);
      setAnim("pg-in");
      window.scrollTo({ top: 0, behavior: "instant" as any });
      if (v === "home") {
        fetch(`/api/streak?today=${todayStr}`)
          .then(r => r.ok ? r.json() : null)
          .then(sd => {
            if (!sd) return;
            setStreak(sd);
            setStreakLoaded(true);
            setDisplayedStreak(sd.currentStreak);
            prevStreakRef.current = sd.currentStreak;
          })
          .catch(() => {});
      }
      if (v === "settings") {
        setSettingsMobileView("menu");
        fetch("/api/user/profile").then(r => r.ok ? r.json() : null).then(d => {
          if (!d) return;
          setProfileData(d);
          setProfileName(d.name || "");
          setProfileUsername(d.username || "");
          setProfileImage(d.image || "");
        }).catch(() => {});
      }
    }, 200);
  }, [unlockedIds, view, selId, syncCloud, todayStr, lsFlush]);

  const navByTitle = useCallback((title: string) => {
    const target = Object.values(entriesRef.current).find((e: any) => e.title?.toLowerCase() === title.trim().toLowerCase());
    if (target) nav("read", target.id);
  }, [nav]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('[data-note-link]');
      if (link) {
        const title = link.getAttribute('data-note-link');
        if (title) {
          e.preventDefault();
          navByTitle(title);
        }
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [navByTitle]);

  const handleUnlock = useCallback(async (credential: string) => {
    setUnlockError("");
    if (!credential.trim() || !pendingNav?.id) return;
    const noteEntry = entriesRef.current[pendingNav.id];
    const isPin = noteEntry?.lockType === "pin";
    try {
      const body = isPin
        ? { id: pendingNav.id, pin: credential }
        : { id: pendingNav.id, password: credential };
      const res = await fetch("/api/notes/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.verified && data.id) {
        const updated = { ...entriesRef.current[data.id], ...data };
        const nextEntries = { ...entriesRef.current, [data.id]: updated };
        setEntries(nextEntries);
        lsFlush(nextEntries);
        setUnlockedIds(prev => [...prev, data.id]);
        setShowUnlock(false);
        setUnlockError("");
        nav(pendingNav.v, pendingNav.id);
        setPendingNav(null);
      } else if (res.status === 401 && data.error === "Unauthorized") {
        setUnlockError("Sesi habis, coba login ulang.");
      } else if (data.error === "No password set") {
        setUnlockError("Akun belum punya password.");
      } else {
        setUnlockError(isPin ? "PIN salah." : "Kata sandi salah.");
      }
    } catch {
      setUnlockError("Gagal memverifikasi.");
    }
  }, [pendingNav, nav, lsFlush]);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkVerifyDelete, setBulkVerifyDelete] = useState(false);
  const [bulkVerifyError, setBulkVerifyError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => typeof window !== "undefined" ? localStorage.getItem("catatanku_notif_enabled") !== "0" : true);
  const [notifStreakEnabled, setNotifStreakEnabled] = useState(() => typeof window !== "undefined" ? localStorage.getItem("catatanku_notif_streak") !== "0" : true);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [verifyDeleteError, setVerifyDeleteError] = useState("");

  const requestDelete = useCallback((e: any) => {
    if (e.isLocked && !unlockedIds.includes(e.id)) {
      setPendingDelete(e);
    } else {
      setDeleteTarget(e);
    }
  }, [unlockedIds]);

  const handleVerifyDelete = useCallback(async (credential: string) => {
    setVerifyDeleteError("");
    const isPin = pendingDelete?.lockType === "pin";
    try {
      let verified = false;
      if (isPin) {
        const res = await fetch("/api/notes/unlock", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pendingDelete.id, pin: credential }),
        });
        const data = await res.json();
        verified = !!data.verified;
      } else {
        const res = await fetch("/api/auth/verify-password", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: credential }),
        });
        const data = await res.json();
        verified = !!data.verified;
      }
      if (verified) {
        setDeleteTarget(pendingDelete);
        setPendingDelete(null);
      } else {
        setVerifyDeleteError(isPin ? "PIN salah." : "Kata sandi salah.");
      }
    } catch { setVerifyDeleteError("Gagal memverifikasi."); }
  }, [pendingDelete]);
  const tRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout|null>(null);
  const lastSavedWordsRef = useRef<number>(0);
  const entriesRef = useRef(entries);
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  useEffect(() => {
    const saved = localStorage.getItem("catatanku_fontsize");
    if (saved !== null) setFontSize(Number(saved));
  }, []);
  const changeFontSize = useCallback((dir: number) => {
    const next = Math.max(0, Math.min(2, fontSize + dir));
    setFontSize(next);
    localStorage.setItem("catatanku_fontsize", String(next));
  }, [fontSize]);
  // Only re-run when the visually relevant fields change, not on every keystroke
  const _entryTheme = (view === "write" || view === "read") ? (entriesRef.current[selId!]?.theme ?? null) : null;
  const _entryColor = (view === "write" || view === "read") ? (entriesRef.current[selId!]?.color ?? null) : null;
  const _entryMood  = (view === "write" || view === "read") ? (entriesRef.current[selId!]?.mood  ?? null) : null;
  useEffect(() => {
    let color = "#FAF6F0"; // Default to var(--bg)
    if ((view === "write" || view === "read") && selId && entriesRef.current[selId]) {
      const e = entriesRef.current[selId];
      const theme = e.theme ? NOTE_THEMES.find(t => t.id === e.theme) : null;
      const nCol = !theme && e.color ? NOTE_COLORS.find(c => c.id === e.color) : null;
      const mood = (!theme && !nCol && e.mood != null) ? MOODS[e.mood] : null;
      color = theme?.bg || nCol?.bg || mood?.soft || "#FAF6F0";
    }
    
    // Imperatively update meta tag
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    if (meta.getAttribute('content') !== color) {
      meta.setAttribute('content', color);
    }
  }, [view, selId, _entryTheme, _entryColor, _entryMood]);

  // Set data-theme on <html> directly — triggers CSS variable overrides in globals.css
  useEffect(() => {
    const inNote = (view === "read" || view === "write") && selId && entriesRef.current[selId];
    const themeId = inNote ? entriesRef.current[selId].theme : null;
    if (themeId) {
      if (document.documentElement.getAttribute("data-theme") !== themeId) {
        document.documentElement.setAttribute("data-theme", themeId);
      }
    } else {
      if (document.documentElement.hasAttribute("data-theme")) {
        document.documentElement.removeAttribute("data-theme");
      }
    }
  }, [view, selId, _entryTheme]);

  // Audio: swap/play/stop when note or song changes (iTunes only; YouTube uses iframe)
  const currentSongId = (view === "read" || view === "write") && selId ? (entries as any)[selId]?.songId || null : null;
  const currentSongPreview = (view === "read" || view === "write") && selId ? (entries as any)[selId]?.songPreview || null : null;
  const isYouTubeSong = currentSongId?.startsWith("yt_") || false;
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlaying(false);
    if (currentSongPreview && !isYouTubeSong) {
      const a = new Audio(currentSongPreview);
      a.loop = true;
      a.volume = 0.5;
      audioRef.current = a;
      a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    return () => {
      if (audioRef.current) { audioRef.current.pause(); }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongPreview, isYouTubeSong]);

  const fontSizeRem = [0.95, 1.05, 1.18][fontSize];
  const fontLineH = [2.0, 2.2, 2.4][fontSize];

  useEffect(() => {
    if (status === "authenticated") {
      (async () => {
        try {
          const csrfRes = await fetch("/api/csrf");
          if (csrfRes.ok) { const { token } = await csrfRes.json(); csrfRef.current = token; }
          const res = await fetch("/api/notes");
          const cloudData = await res.json();
          const cloud: Record<string, any> = {};
          if (Array.isArray(cloudData)) cloudData.forEach((e: any) => cloud[e.id] = e);

          const localStr = localStorage.getItem("catatanku_entries");
          const local: Record<string, any> = localStr ? JSON.parse(localStr) : {};

          // Cloud is source of truth — only keep local data for notes that exist in DB
          // If a note is only in local (DB save failed), don't render it
          const merged: Record<string, any> = { ...cloud };
          Object.keys(local).forEach(id => {
            if (cloud[id] && local[id].ts > cloud[id].ts) merged[id] = local[id];
          });

          setEntries(merged);
          localStorage.setItem("catatanku_entries", JSON.stringify(merged));
        } catch(e) {}
        // Check Ramadan (Hijri calendar)
        try {
          const cached = sessionStorage.getItem("catatanku_hijri");
          if (cached) {
            setIsRamadan(JSON.parse(cached).isRamadan === true);
          } else {
            const hr = await fetch("/api/hijri");
            if (hr.ok) {
              const hd = await hr.json();
              setIsRamadan(hd.isRamadan === true);
              sessionStorage.setItem("catatanku_hijri", JSON.stringify(hd));
            }
          }
        } catch(e) {}
        // Fetch streak
        try {
          const sr = await fetch(`/api/streak?today=${todayStr}`);
          if (sr.ok) {
            const sd = await sr.json();
            setStreak(sd);
            setStreakLoaded(true);
            const target: number = sd.currentStreak;
            const prev = prevStreakRef.current;
            if (target > prev) {
              let cur = prev;
              const steps = Math.min(target - prev, 30);
              const iv = setInterval(() => {
                cur++;
                setDisplayedStreak(cur);
                if (cur >= target) { clearInterval(iv); }
              }, Math.max(600 / steps, 20));
            } else {
              setDisplayedStreak(target);
            }
            prevStreakRef.current = target;
            const milestones = [3, 7, 14, 30, 100];
            if (milestones.includes(target) && sd.status === "active") {
              setShowMilestoneBurst(true);
              setTimeout(() => setShowMilestoneBurst(false), 2200);
            }
          }
        } catch(e) {}
        setLoaded(true);
      })();
    } else if (status === "unauthenticated") {
      setLoaded(true);
    }
  }, [status]);



  const newEntry = useCallback((date: string) => {
    const id = uid();
    const defFont = localStorage.getItem("catatanku_def_font") || "";
    const defColor = localStorage.getItem("catatanku_def_color") || "";
    const defShareMusic = localStorage.getItem("catatanku_def_sharemusic") !== "false";
    const fresh = { id, date, title:"", text:"", mood:null, stickers:[], ts: Date.now(), isPinned: false, color: defColor, theme: '', shareId: null, isOneTime: false, songId: '', songTitle: '', songArtwork: '', songPreview: '', shareMusic: defShareMusic, font: defFont };
    const nextEntries = { ...entriesRef.current, [id]: fresh };
    setEntries(nextEntries);
    lsFlush(nextEntries);
    lastSavedWordsRef.current = 0;
    nav("write", id);
  }, [nav, lsFlush]);

  const entry = selId ? (entries[selId] || null) : null;
  const upd = useCallback((f: string, v: any) => {
    if (!selId) return;
    const updatedNote = { ...entriesRef.current[selId], [f]: v, ts: Date.now() };
    const nextEntries = { ...entriesRef.current, [selId]: updatedNote };
    setEntries(nextEntries);
    // Debounce LS for text/title (typed every keystroke); flush immediately for other fields
    if (f === "text" || f === "title") lsSchedule(nextEntries);
    else lsFlush(nextEntries);
    const isImmediate = f !== "text" && f !== "title";
    syncCloud(nextEntries, updatedNote, isImmediate);
  }, [selId, syncCloud, lsSchedule, lsFlush]);

  const updMany = useCallback((fields: Record<string, any>) => {
    if (!selId) return;
    const updatedNote = { ...entriesRef.current[selId], ...fields, ts: Date.now() };
    const nextEntries = { ...entriesRef.current, [selId]: updatedNote };
    setEntries(nextEntries);
    lsFlush(nextEntries);
    syncCloud(nextEntries, updatedNote, true);
  }, [selId, syncCloud, lsFlush]);
  const addYouTubeSong = useCallback(async (url: string) => {
    setYtLoading(true); setYtError(""); setYtPreview(null);
    try {
      const r = await fetch(`/api/music/youtube?url=${encodeURIComponent(url)}`);
      const d = await r.json();
      if (!r.ok) { setYtError(d.error || "URL tidak valid"); setYtLoading(false); return; }
      setYtPreview({ id: d.id, title: d.title, author: d.author, thumbnail: d.thumbnail });
    } catch { setYtError("Gagal memuat video"); }
    setYtLoading(false);
  }, []);
  const confirmYtSong = useCallback((p: {id:string;title:string;author:string;thumbnail:string}, closeDropdown?: ()=>void) => {
    updMany({ songId: p.id, songTitle: `${p.title} - ${p.author}`, songArtwork: p.thumbnail, songPreview: "" });
    setYtUrl(""); setYtPreview(null); setYtError("");
    closeDropdown?.();
  }, [updMany]);
  const toggleSticker = useCallback((s: string) => {
    if (!selId) return;
    const cur = entry?.stickers || [];
    const next = cur.includes(s) ? cur.filter((x: string)=>x!==s) : [...cur, s];
    upd("stickers", next);
  }, [selId, entry, upd]);

  const doDelete = useCallback(async (id: string) => {
    if (saveTimeoutRef.current) { clearTimeout(saveTimeoutRef.current); saveTimeoutRef.current = null; }
    const nextEntries = { ...entriesRef.current }; delete nextEntries[id];
    setEntries(nextEntries);
    lsFlush(nextEntries);

    try { await fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfRef.current } }); } catch(e) {}
    setDeleteTarget(null);
    // Refresh streak after delete
    try {
      const sr = await fetch(`/api/streak?today=${todayStr}`);
      if (sr.ok) { const sd = await sr.json(); setStreak(sd); setDisplayedStreak(sd.currentStreak); prevStreakRef.current = sd.currentStreak; }
    } catch(e) {}
    if (id === selId) nav("home");
  }, [todayStr, selId, nav, lsFlush]);

  const doDeleteMany = useCallback(async (ids: string[]) => {
    const nextEntries = { ...entriesRef.current };
    ids.forEach(id => delete nextEntries[id]);
    setEntries(nextEntries);
    lsFlush(nextEntries);
    await Promise.all(ids.map(id => fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfRef.current } }).catch(() => {})));
    setSelectedIds(new Set());
    setSelectMode(false);
    try {
      const sr = await fetch(`/api/streak?today=${todayStr}`);
      if (sr.ok) { const sd = await sr.json(); setStreak(sd); setDisplayedStreak(sd.currentStreak); prevStreakRef.current = sd.currentStreak; }
    } catch(e) {}
  }, [todayStr, lsFlush]);

  const duplicateNote = useCallback(async (e: any) => {
    if (e.isLocked) return;
    try {
      const res = await fetch("/api/notes/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfRef.current },
        body: JSON.stringify({ sourceId: e.id }),
      });
      if (!res.ok) return;
      const duplicated = await res.json();
      const nextEntries = { ...entriesRef.current, [duplicated.id]: duplicated };
      setEntries(nextEntries);
      lsFlush(nextEntries);
      nav("write", duplicated.id);
    } catch(err) {}
  }, [nav, lsFlush]);

  const getCleanText = useCallback((e: any) => {
    const mood = e.mood != null ? MOODS[e.mood] : null;
    const blocks = parseBlocks(e.text || "");
    const bodyText = blocks.map(b => {
      if (b.type === 'text') {
        const divProcessed = b.content
          .replace(/<div[^>]*>/gi, '\n')
          .replace(/<\/div>/gi, '')
          .replace(/<br\s*\/?>/gi, '\n');
        return stripHtml(divProcessed);
      }
      if (b.type === 'todo') return (b.done ? '[x] ' : '[ ] ') + b.content;
      if (b.type === 'image') return `[Gambar: ${b.url}]`;
      if (b.type === 'gallery') return `[Galeri: ${b.urls.length} foto]`;
      if (b.type === 'link') {
        const t = b.title || 'Link';
        return `${t}: ${b.url}`;
      }
      if (b.type === 'table') {
        return b.rows.map(row => row.join(' | ')).join('\n');
      }
      return '';
    }).filter(v => v.trim()).join('\n\n');

    return [
      e.title || 'Tanpa Judul',
      fullD(e.date || '') + (timeStr(e.ts) ? ' · ' + timeStr(e.ts) : ''),
      mood ? `Perasaan: ${mood.label} ${mood.emoji}` : '',
      '',
      bodyText
    ].filter(s => s !== null).join('\n');
  }, []);

  const exportNote = useCallback((e: any) => {
    const content = getCleanText(e);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = e.title || `catatan-${e.date}`;
    a.href = url; a.download = `${fileName}.txt`; a.click();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  }, [getCleanText]);

  const exportPDF = useCallback(() => {
    setShowDownloadModal(false);
    const oldTitle = document.title;
    const noteTitle = entry?.title || `catatan-${entry?.date || 'download'}`;
    document.title = noteTitle;
    setTimeout(() => {
      window.print();
      document.title = oldTitle;
    }, 150);
  }, [entry]);

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/notes/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload gagal");
    const data = await res.json();
    return data.url;
  };

  const handleShare = useCallback(async (isOneTime: boolean = false) => {
    if (!selId) return;
    const res = await fetch('/api/notes/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selId, enable: true, isOneTime }) });
    const data = await res.json();
    if (data.shareId) {
      updMany({ shareId: data.shareId, isOneTime });
    }
  }, [selId, updMany]);

  const handleRevoke = useCallback(async () => {
    if (!selId) return;
    await fetch('/api/notes/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selId, enable: false }) });
    upd('shareId', null);
  }, [selId, upd]);

  // Lifecycle sync: ensure data is pushed on close/hide
  useEffect(() => {
    const handleSync = () => {
      if (view === "write" && selId && entriesRef.current[selId]) {
        syncCloud(entriesRef.current, entriesRef.current[selId], true);
      }
    };
    window.addEventListener("beforeunload", handleSync);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleSync();
    });
    return () => {
      window.removeEventListener("beforeunload", handleSync);
    };
  }, [view, selId, syncCloud]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // Escape: exit focus mode → or go back to list
      if (e.key === 'Escape') {
        if (focusMode) { setFocusModeWrapper(false); return; }
        if ((view === 'read' || view === 'write') && !isInput) { nav('home'); return; }
        if (showSearch) { setShowSearch(false); setQ(''); return; }
      }

      if (e.ctrlKey || e.metaKey) {
        // Ctrl+M → new note (any view, not in input)
        if ((e.key === 'm' || e.key === 'M') && !e.shiftKey && !isInput) {
          e.preventDefault();
          newEntry(new Date().toISOString().slice(0, 10));
          return;
        }
        // Ctrl+F → focus search
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          if (view !== 'home' && view !== 'list') nav('list');
          setShowSearch(true);
          setTimeout(() => searchInputRef.current?.focus(), 80);
          return;
        }
        // Ctrl+D → duplicate current note (read/write view)
        if ((e.key === 'd' || e.key === 'D') && !e.shiftKey && (view === 'read' || view === 'write') && selId) {
          e.preventDefault();
          const entry = entries[selId];
          if (entry) duplicateNote(entry);
          return;
        }
        // Ctrl+Shift+L → lock all unlocked notes
        if ((e.key === 'l' || e.key === 'L') && e.shiftKey && !isInput) {
          e.preventDefault();
          if (unlockedIds.length > 0) {
            // If currently viewing a note that was unlocked (i.e. locked), go home
            if ((view === 'read' || view === 'write') && selId && entriesRef.current[selId]?.isLocked) {
              nav('home');
            }
            setUnlockedIds([]);
            setLockToast(true);
            setTimeout(() => setLockToast(false), 2000);
          }
          return;
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focusMode, view, selId, showSearch, unlockedIds, newEntry, duplicateNote, nav]);

  // Exit focus mode when leaving write view
  useEffect(() => { if (view !== "write" && view !== "read") setFocusModeWrapper(false); }, [view, setFocusModeWrapper]);

  // User search — debounce 350ms when q starts with @
  useEffect(() => {
    const term = q.startsWith("@") ? q.slice(1).trim() : "";
    if (!term) { setUserResults([]); setUserSearchLoading(false); return; }
    setUserSearchLoading(true);
    clearTimeout(userSearchTimerRef.current);
    userSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`);
        if (res.ok) setUserResults(await res.json());
      } catch {}
      setUserSearchLoading(false);
    }, 350);
    return () => clearTimeout(userSearchTimerRef.current);
  }, [q]);

  const allSorted = useMemo(() => Object.values(entries).filter((e: any)=>hasContent(e)).sort((a: any, b: any)=>{
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.ts||0)-(a.ts||0);
  }), [entries]);
  const total = allSorted.length;
  const byDate: Record<string, any[]> = useMemo(() => {
    const res: Record<string, any[]> = {};
    Object.values(entries).forEach((e: any) => { if(!hasContent(e)) return; if(!res[e.date]) res[e.date]=[]; res[e.date].push(e); });
    Object.keys(res).forEach(d => res[d].sort((a: any,b: any)=>(b.ts||0)-(a.ts||0)));
    return res;
  }, [entries]);
  const todayEntries = byDate[todayStr] || [];
  const hasDate = (ds: string) => (byDate[ds]?.length || 0) > 0;
  const dateMood = (ds: string) => { const l=byDate[ds]; if(!l?.length) return null; return l[0].mood!=null?MOODS[l[0].mood]:null; };
  const entryMood = (e: any) => e.mood!=null ? MOODS[e.mood] : null;

  const greet = useMemo(() => {
    const hr = today.getHours();
    const name = session?.user?.name?.split(" ")[0] || "";
    let pool = ["Halo!"];
    if (hr < 5) pool = ["Selamat Malam", "Masih terjaga?", "Malam yang sunyi...", "Waktunya istirahat?", "Malam, jangan lupa tidur ya.", "Menemukan ketenangan malam?"];
    else if (hr < 12) pool = ["Selamat Pagi", "Awali harimu dengan senyum", "Pagi yang cerah!", "Semangat pagi!", "Sudah minum kopi?", "Hari baru, cerita baru.", "Pagi, apa rencanamu hari ini?"];
    else if (hr < 17) pool = ["Selamat Siang", "Semangat aktivitasnya!", "Jangan lupa makan siang", "Siang yang produktif", "Halo, semangat terus ya!", "Siang, butuh rehat sejenak?"];
    else if (hr < 19) pool = ["Selamat Sore", "Waktunya bersantai", "Sore yang tenang", "Menjelang senja...", "Tenangkan pikiran sejenak.", "Sore, ceritakan senjamu."];
    else pool = ["Selamat Malam", "Waktunya beristirahat", "Malam yang damai", "Ceritakan harimu di sini", "Malam, selamat beristirahat.", "Cukup untuk hari ini?"];
    
    const idx = Math.floor((Math.random() * pool.length));
    let base = pool[idx];
    if (name) {
      if (base.endsWith("?")) return base.replace("?", `, ${name}?`);
      if (base.endsWith(".")) return base.replace(".", `, ${name}.`);
      return `${base}, ${name}`;
    }
    return base;
  }, [view === "home", session?.user?.name]); // Re-roll when going home or login
  const tagCounts: Record<string,number> = useMemo(() => {
    const res: Record<string,number> = {};
    allSorted.forEach((e:any) => (e.tags||[]).forEach((t:string) => { res[t]=(res[t]||0)+1; }));
    return res;
  }, [allSorted]);
  const allTags = useMemo(() => Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).map(([tag,count])=>({tag,count})), [tagCounts]);

  // Pre-build search index once per allSorted change — avoids O(n×regex) on every keystroke
  const noteSearchIndex = useMemo(() =>
    new Map(allSorted.map((e: any) => [
      e.id,
      ((e.title || '') + ' ' + getPreviewText(e.text || '') + ' ' + (e.tags || []).join(' ')).toLowerCase()
    ])),
  [allSorted]);

  const filtered = useMemo(() => {
    const lq = q.trim().toLowerCase();
    return allSorted.filter((e: any) => {
      const matchQ = !lq || (noteSearchIndex.get(e.id) || '').includes(lq);
      const matchTag = !activeTag || (e.tags||[]).includes(activeTag);
      return matchQ && matchTag;
    });
  }, [allSorted, noteSearchIndex, q, activeTag]);

  const nonTodayNotes = useMemo(() => allSorted.filter((e: any) => e.date !== todayStr), [allSorted, todayStr]);
  const notesWithLoc  = useMemo(() => allSorted.filter((e: any) => e.lat != null && e.lng != null), [allSorted]);
  const onOpenMapNote = useCallback((id: string) => nav("read", id), [nav]);

  const homeStats = useMemo(() => {
    const todayObj = new Date(todayStr + "T00:00:00");
    const thisMonthCount = allSorted.filter((e: any) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getMonth() === todayObj.getMonth() && d.getFullYear() === todayObj.getFullYear();
    }).length;
    const moodTally: Record<number, number> = {};
    allSorted.forEach((e: any) => { if (e.mood != null) moodTally[e.mood] = (moodTally[e.mood] || 0) + 1; });
    const topMoodIdx = Object.keys(moodTally).length
      ? parseInt(Object.entries(moodTally).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0])
      : null;
    return { thisMonthCount, topMood: topMoodIdx != null ? MOODS[topMoodIdx] : null };
  }, [allSorted, todayStr]);

  const dailyTasks = useMemo(() => {
    return [
      { id: "write", label: "Tulis cerita hari ini", done: todayEntries.length > 0, icon: "✍️" },
      { id: "mood", label: "Pilih suasana hati", done: todayEntries.some((e:any) => e.mood != null), icon: "🎭" },
      { id: "sticker", label: "Pasang stiker favorit", done: todayEntries.some((e:any) => e.stickers?.length > 0), icon: "✨" }
    ];
  }, [todayEntries]);

  const keywordAnalysis = useMemo(() => {
    // Common Indonesian stop words
    const stopWords = ["yang", "di", "dan", "ke", "itu", "adalah", "dengan", "untuk", "dari", "pada", "dalam", "bisa", "akan", "saya", "kamu", "dia", "mereka", "setiap", "kita", "ini", "itu", "sudah", "telah", "oleh", "juga", "atau", "sehingga", "karena", "namun", "tetapi", "ia", "secara", "ada", "seperti", "sebagai", "jika", "kalau", "saat", "setelah", "sebelum", "ketika", "buat", "tersebut", "saja", "lagi", "masih", "belum", "agar", "supaya", "apa", "mana", "siapa", "kapan", "bagaimana", "mengapa", "jangan", "pasti", "sangat", "cukup", "terlalu", "paling", "kurang", "lebih", "tadi", "tadi", "banget", "pada", "pula", "kalau", "dari"];
    const tally: Record<string, number> = {};
    allSorted.forEach((e: any) => {
      const text = (e.title || "") + " " + getPreviewText(e.text || "");
      const words = text.toLowerCase().match(/[a-z0-9]{4,}/g); // Words with at least 4 chars
      if (words) {
        words.forEach(w => {
          if (!stopWords.includes(w) && isNaN(Number(w))) {
            tally[w] = (tally[w] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word, count]) => ({ word, count }));
  }, [allSorted]);

  // Auto-dismiss companion bubble after 7s
  useEffect(() => {
    if (showCompanionChat) {
      const t = setTimeout(() => setShowCompanionChat(false), 7000);
      return () => clearTimeout(t);
    }
  }, [showCompanionChat]);

  // Periodic speak every 90 seconds, rotate message index
  useEffect(() => {
    if (companionType === "none") return;
    const iv = setInterval(() => {
      setCompanionMsgIdx(i => i + 1);
      setShowCompanionChat(true);
    }, 90000);
    return () => clearInterval(iv);
  }, [companionType]);

  // GPS capture: grab location once per note per session when entering write view
  useEffect(() => {
    if (view !== "write" || !locationEnabled || !selId) return;
    if (gpsGrabbedRef.current.has(selId)) return;
    if ((entry as any)?.lat != null) { gpsGrabbedRef.current.add(selId); return; }
    gpsGrabbedRef.current.add(selId);
    navigator.geolocation?.getCurrentPosition(
      (pos) => updMany({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently ignore denied / unavailable
    );
  }, [view, selId, locationEnabled, entry, updMany]);

  // Celebrate when a note save completes — at most once every 15 minutes
  useEffect(() => {
    if (companionType === "none") return;
    if (prevSavingRef.current && !saving) {
      const now = Date.now();
      if (now - petLastCelebratedRef.current > 15 * 60 * 1000) {
        petLastCelebratedRef.current = now;
        setPetJustSaved(true);
        setCompanionMsgIdx(i => i + 1);
        setShowCompanionChat(true);
        const t = setTimeout(() => setPetJustSaved(false), 5500);
        return () => clearTimeout(t);
      }
    }
    prevSavingRef.current = saving;
  }, [saving, companionType]);

  // Derive the pet's current mood based on context
  const petMood = useMemo((): string => {
    if (companionType === "none") return "curious";
    // Priority 1: post-save celebration
    if (petJustSaved) return "celebrating";
    // Priority 2: recent click
    if (companionJustInteracted) return "loving";

    const s = streak?.currentStreak || 0;
    const status = streak?.status ?? "broken";
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 6;

    if (view === "write") {
      // Negative-mood empathy: Sedih(2), Marah(3), Rindu(4), Cemas(5), Lelah(7), Bingung(9)
      const noteMoodIdx = entry?.mood;
      if (noteMoodIdx != null && [2, 3, 4, 5, 7, 9].includes(noteMoodIdx)) return "empathy";
      // Word count milestone
      const wc = (entry?.text || "").replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length;
      if (wc >= 100) return "milestone";
      // Default write mood
      return s >= 7 ? "proud" : "excited";
    }

    if (s >= 7 && status === "active") return "proud";
    if (status === "active") return "happy";
    if (status === "broken") return isNight ? "sleepy" : "lonely";
    if (isNight) return "sleepy";
    return "curious"; // at_risk or default
  }, [companionType, petJustSaved, companionJustInteracted, streak, view, entry]);

  const CompanionOverlay = useMemo(() => {
    if (companionType === "none") return null;
    const isHome = view === "home";
    const isWrite = view === "write";
    if (!isHome && !isWrite) return null;

    const charData = COMPANIONS.find(c => c.id === companionType) || COMPANIONS[1];
    const msgs = COMPANION_MSGS[companionType];
    const moodVis = MOOD_VISUALS[petMood] || MOOD_VISUALS.curious;
    const name = companionName || charData.defName;
    const s = streak?.currentStreak || 0;

    // Border color: mood override > companion accent
    const borderColor = moodVis.borderColor || charData.color;
    const glowColor = moodVis.borderColor || charData.color;

    // Time-of-day greeting prefix (shown on first bubble of each session for home view)
    const hour = new Date().getHours();
    const timeGreet =
      hour < 6  ? "Begadang nih~ " :
      hour < 11 ? "Selamat pagi! " :
      hour < 15 ? "Selamat siang~ " :
      hour < 19 ? "Selamat sore! " :
      hour < 22 ? "Selamat malam~ " : "";

    // Message selection: interact > mood-specific > streak > contextual
    let msg = "";
    if (msgs) {
      if (companionJustInteracted) {
        msg = msgs.interact[companionMsgIdx % msgs.interact.length];
      } else if (petMood in msgs.moods) {
        const moodArr = msgs.moods[petMood as keyof typeof msgs.moods];
        msg = moodArr[companionMsgIdx % moodArr.length];
      } else if (s >= 30) {
        msg = msgs.streak30;
      } else if (s >= 7) {
        msg = msgs.streak7;
      } else if (s >= 3) {
        msg = msgs.streak3;
      } else {
        const arr = isWrite ? msgs.write : msgs.home;
        msg = arr[companionMsgIdx % arr.length];
      }
      // Prepend time greeting for first home bubble (non-special moods)
      if (!isWrite && companionMsgIdx === 0 && timeGreet && !["celebrating","empathy","milestone","loving","proud"].includes(petMood)) {
        msg = timeGreet + msg;
      }
    }

    // Hearts indicator based on streak + mood
    const heartCount = s >= 7 ? 3 : s >= 3 ? 2 : s >= 1 ? 1 : 0;
    const hearts = "♥".repeat(heartCount) + "♡".repeat(3 - heartCount);
    const avatarSize = isWrite ? 46 : 54;

    // CSS animation name must be unique per float speed to avoid conflicts
    const animName = `petFloat_${moodVis.floatDur.replace(".", "_")}`;

    return (
      <div key="companion" style={{
        position: "fixed",
        right: isWrite ? 14 : 20,
        bottom: isWrite ? 72 : 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        zIndex: 80,
        pointerEvents: "none",
      }}>
        {/* Chat bubble */}
        <div style={{
          pointerEvents: "auto",
          opacity: showCompanionChat ? 1 : 0,
          transform: showCompanionChat ? "translateY(0) scale(1)" : "translateY(10px) scale(0.94)",
          transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          maxWidth: 210,
          position: "relative",
        }}>
          {/* Mood label chip inside bubble */}
          <div style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(14px)",
            padding: "9px 13px 10px",
            borderRadius: "16px 16px 4px 16px",
            border: `1.5px solid ${borderColor}38`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px ${borderColor}12`,
          }}>
            {/* Mood chip at top of bubble */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: ".78rem", lineHeight: 1 }}>{moodVis.expr}</span>
              <span style={{ fontFamily: "'Lora',serif", fontSize: ".6rem", color: borderColor, fontWeight: 600, opacity: .85 }}>{moodVis.label}</span>
            </div>
            <p style={{ fontFamily: "'Lora',serif", fontSize: ".74rem", color: "var(--ink)", margin: 0, lineHeight: 1.5 }}>{msg}</p>
          </div>
          {/* Bubble tail */}
          <div style={{ position: "absolute", bottom: -7, right: 20, width: 13, height: 9, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{
              position: "absolute", bottom: 2, right: 0, width: 12, height: 12,
              background: "rgba(255,255,255,0.97)",
              border: `1.5px solid ${borderColor}38`,
              borderRadius: "0 0 0 3px",
              transform: "rotate(-45deg)",
              transformOrigin: "bottom right",
            }}/>
          </div>
        </div>

        {/* Pet avatar column */}
        <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {/* Name + hearts tag */}
          <div style={{
            background: `${borderColor}14`,
            border: `1px solid ${borderColor}35`,
            borderRadius: 20,
            padding: "2px 10px",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ fontSize: ".58rem", color: borderColor, fontFamily: "'Lora',serif", fontWeight: 700 }}>{name}</span>
            <span style={{ fontSize: ".52rem", color: borderColor, letterSpacing: ".04em", opacity: .75 }}>{hearts}</span>
          </div>

          {/* Avatar with mood expression badge */}
          <div style={{ position: "relative" }}>
            {/* Mood expression badge (top-left of avatar) */}
            <div style={{
              position: "absolute",
              top: -4, left: -6,
              fontSize: ".8rem",
              lineHeight: 1,
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,.18))",
              animation: moodVis.pulse ? `petExprPop 2s ease-in-out infinite` : "none",
              zIndex: 2,
              pointerEvents: "none",
            }}>
              {moodVis.expr}
            </div>

            {/* Pulse ring for excited/loving/proud moods */}
            {moodVis.pulse && (
              <div style={{
                position: "absolute",
                inset: -5,
                borderRadius: "50%",
                border: `2px solid ${glowColor}`,
                animation: "petPulseRing 1.8s ease-out infinite",
                pointerEvents: "none",
              }}/>
            )}

            <button
              title={`${name} — klik untuk ngobrol`}
              onClick={() => {
                setCompanionJustInteracted(true);
                setCompanionMsgIdx(i => i + 1);
                setShowCompanionChat(true);
                setTimeout(() => setCompanionJustInteracted(false), 8000);
              }}
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: "50%",
                background: `${glowColor}16`,
                border: `2.5px solid ${borderColor}70`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isWrite ? "1.5rem" : "1.75rem",
                boxShadow: `0 5px 18px ${glowColor}${moodVis.glowAlpha}, 0 2px 5px rgba(0,0,0,0.07)`,
                cursor: "pointer",
                animation: petMood === "celebrating"
                  ? `petCelebShake 0.5s ease-in-out infinite`
                  : `${animName} ${moodVis.floatDur} ease-in-out infinite`,
                transition: "transform .15s, box-shadow .15s",
                padding: 0, outline: "none",
                opacity: petMood === "sleepy" ? 0.75 : 1,
              }}
            >
              {charData.icon}
            </button>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ${animName} {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-7px) rotate(${["excited","loving","celebrating"].includes(petMood) ? "3" : "0"}deg); }
          }
          @keyframes petPulseRing {
            0%   { transform: scale(1);    opacity: .55; }
            70%  { transform: scale(1.28); opacity: 0;   }
            100% { transform: scale(1.28); opacity: 0;   }
          }
          @keyframes petExprPop {
            0%, 100% { transform: scale(1) rotate(-8deg); }
            50%      { transform: scale(1.2) rotate(8deg); }
          }
          @keyframes petCelebShake {
            0%,100% { transform: translateY(-7px) rotate(-4deg); }
            25%     { transform: translateY(-11px) rotate(4deg) scale(1.08); }
            75%     { transform: translateY(-9px) rotate(-3deg) scale(1.05); }
          }
          button[title$="klik untuk ngobrol"]:hover  { transform: scale(1.09) !important; }
          button[title$="klik untuk ngobrol"]:active { transform: scale(0.92) !important; }
        `}} />
      </div>
    );
  }, [companionType, companionName, streak, view, showCompanionChat, companionMsgIdx, companionJustInteracted, petMood, petJustSaved, entry]);

  const medals = useMemo(() => {
    const list = [
      { id: "pioneer", label: "Pionir", icon: "🌱", desc: "Menulis catatan pertama", check: (all: any[]) => all.length >= 1 },
      { id: "writer", label: "Penulis", icon: "✍️", desc: "Menulis 10 catatan", check: (all: any[]) => all.length >= 10 },
      { id: "chronicler", label: "Kronikus", icon: "📜", desc: "Menulis 50 catatan", check: (all: any[]) => all.length >= 50 },
      { id: "legend", label: "Legenda", icon: "👑", desc: "Menulis 100 catatan", check: (all: any[]) => all.length >= 100 },
      { id: "streak3", label: "Tanpa Henti", icon: "🔥", desc: "Streak 3 hari berturut-turut", check: () => (streak?.currentStreak || 0) >= 3 || (streak?.longestStreak || 0) >= 3 },
      { id: "streak7", label: "Konsisten", icon: "⚡", desc: "Streak 7 hari berturut-turut", check: () => (streak?.currentStreak || 0) >= 7 || (streak?.longestStreak || 0) >= 7 },
      { id: "streak30", label: "Tak Terkalahkan", icon: "💎", desc: "Streak 30 hari berturut-turut", check: () => (streak?.currentStreak || 0) >= 30 || (streak?.longestStreak || 0) >= 30 },
       { id: "word500", label: "Ahli Kata", icon: "🚀", desc: "Satu catatan di atas 500 kata", check: (all: any[]) => all.some(e => {
        const raw = (e.text || "").trim();
        const count = raw.split(/\s+/).filter((t:any) => t.length > 0).length;
        return count >= 500;
      }) },
      { id: "word1000", label: "Filosof", icon: "🧠", desc: "Satu catatan di atas 1000 kata", check: (all: any[]) => all.some(e => {
        const raw = (e.text || "").trim();
        const count = raw.split(/\s+/).filter((t:any) => t.length > 0).length;
        return count >= 1000;
      }) },
      { id: "locked", label: "Penjaga Rahasia", icon: "🛡️", desc: "Mengunci setidaknya satu catatan", check: (all: any[]) => all.some(e => e.isLocked) },
      { id: "labeled", label: "Terorganisir", icon: "🏷️", desc: "Menggunakan 5 label berbeda", check: () => Object.keys(tagCounts).length >= 5 },
      { id: "moody", label: "Ekspresif", icon: "🎭", desc: "Menggunakan 5 jenis mood berbeda", check: (all: any[]) => new Set(all.map(e => e.mood).filter(m => m != null)).size >= 5 },
      { id: "sticker_expert", label: "Dekorator", icon: "🎨", desc: "Pakai 5 jenis stiker berbeda", check: (all: any[]) => { const s = new Set(); all.forEach(e => (e.stickers || []).forEach((st: string) => s.add(st))); return s.size >= 5; } },
      { id: "social", label: "Sosial", icon: "🌍", desc: "Publikasikan satu catatan", check: (all: any[]) => all.some(e => e.shareId) },
      { id: "migrator", label: "Petualang Data", icon: "📦", desc: "Berhasil impor catatan JSON", check: (all: any[]) => all.some(e => e.isImported) },
      { id: "themer", label: "Kurator Seni", icon: "🖼️", desc: "Ganti tema catatan 5 kali", check: (all: any[]) => new Set(all.map(e => e.theme).filter(t => t)).size >= 5 },
      { id: "night_owl", label: "Burung Hantu", icon: "🦉", desc: "Nulis di dini hari (00-04)", check: (all: any[]) => all.some(e => { const hr = new Date(e.ts).getHours(); return hr >= 0 && hr < 4; }) },
      { id: "early_bird", label: "Pagi Produktif", icon: "☀️", desc: "Nulis di pagi buta (05-08)", check: (all: any[]) => all.some(e => { const hr = new Date(e.ts).getHours(); return hr >= 5 && hr < 8; }) },
      { id: "focused", label: "Fokus Total", icon: "🧘", desc: "Gunakan Mode Fokus menulis", check: () => focusUsed || databaseMedals.has("focused") },
      { id: "archivist", label: "Arsiparis", icon: "🗄️", desc: "Lakukan ekspor data ke JSON", check: () => exportDone || databaseMedals.has("archivist") },
      { id: "admin", label: "Admin", icon: "🛡️", desc: "Moderator sistem", check: () => databaseMedals.has("admin"), hidden: true },
    ];
    return list.map(m => ({ ...m, done: m.check(allSorted) || databaseMedals.has(m.id) }))
               .filter(m => !m.hidden || m.done);
  }, [allSorted, streak, tagCounts, focusUsed, exportDone, databaseMedals]);
  
  useEffect(() => {
    if (!loaded) return;
    const currentDoneIds = medals.filter(m => m.done).map(m => m.id);
    
    // Initialize seen medals on first load
    if (unlockedMedalIds.size === 0 && currentDoneIds.length > 0) {
      setUnlockedMedalIds(new Set(currentDoneIds));
      
      // Auto-sync medals achieved locally but not yet in DB
      currentDoneIds.forEach(id => {
        if (!databaseMedals.has(id)) {
          fetch("/api/user/medals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ medalId: id })
          }).then(r => {
            if (r.ok) setDatabaseMedalIds(prev => new Set([...Array.from(prev), id]));
          }).catch(() => {});
        }
      });
      return;
    }

    // Check for new ones
    const newlyDone = medals.filter(m => m.done && !unlockedMedalIds.has(m.id));
    if (newlyDone.length > 0) {
      const topMedal = newlyDone[newlyDone.length - 1];
      setMedalToast(topMedal.label);
      setTimeout(() => setMedalToast(null), 3500);
      setUnlockedMedalIds(prev => new Set([...Array.from(prev), ...newlyDone.map(m => m.id)]));
      
      // Sync to DB
      newlyDone.forEach(m => {
        fetch("/api/user/medals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ medalId: m.id })
        }).then(r => {
          if (r.ok) setDatabaseMedalIds(prev => new Set([...Array.from(prev), m.id]));
        }).catch(() => {});
      });
    }
  }, [medals, loaded, unlockedMedalIds]);

  const addTag = useCallback((raw: string) => {
    if (!selId || !entry) return;
    const tag = raw.replace(/^#+/,'').trim().toLowerCase().replace(/\s+/g,'-');
    if (!tag || tag.length > 30) return;
    const cur: string[] = entry.tags || [];
    if (cur.includes(tag) || cur.length >= 10) return;
    upd("tags", [...cur, tag]);
  }, [selId, entry, upd]);
  const removeTag = useCallback((tag: string) => {
    if (!selId || !entry) return;
    upd("tags", (entry.tags||[]).filter((t:string)=>t!==tag));
  }, [selId, entry, upd]);

  useEffect(() => {
    if(tRef.current && view==="write") { tRef.current.style.height="auto"; tRef.current.style.height=tRef.current.scrollHeight+"px"; }
  }, [entry?.text, view]);

  // FCM push notification — show custom prompt first, then call browser API
  useEffect(() => {
    if (!session?.user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") {
      // Already decided — if granted, just refresh token silently
      if (Notification.permission === "granted") {
        import("@/lib/firebase-client").then(({ requestNotificationToken }) => {
          requestNotificationToken().then(token => {
            if (!token) return;
            fetch("/api/notifications/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => {});
          });
        });
      }
      return;
    }
    // Only show once — check localStorage flag
    if (localStorage.getItem("catatanku_notif_asked")) return;
    // Small delay so it doesn't pop up immediately on page load
    const t = setTimeout(() => setShowNotifPrompt(true), 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const handleNotifAllow = useCallback(() => {
    setShowNotifPrompt(false);
    localStorage.setItem("catatanku_notif_asked", "1");
    import("@/lib/firebase-client").then(({ requestNotificationToken }) => {
      requestNotificationToken().then(token => {
        if (!token) return;
        fetch("/api/notifications/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => {});
      });
    });
  }, []);

  const handleNotifLater = useCallback(() => {
    setShowNotifPrompt(false);
    localStorage.setItem("catatanku_notif_asked", "1");
  }, []);

  const readMood = entry?.mood!=null ? MOODS[entry.mood] : null;
  const readNoteColor = entry?.color ? NOTE_COLORS.find(c => c.id === entry.color) : null;
  const readNoteTheme = entry?.theme ? NOTE_THEMES.find(t => t.id === entry.theme) : null;

  // ── Settings state ──
  const [settingsTab, setSettingsTab] = useState("profile");
  const [settingsMobileView, setSettingsMobileView] = useState("menu");
  const [profileName, setProfileName] = useState(session?.user?.name || "");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileImage, setProfileImage] = useState(session?.user?.image || "");
  const [profileTheme, setProfileTheme] = useState("cocoa");
  const [profileBio, setProfileBio] = useState("");
  const [profileInstagram, setProfileInstagram] = useState("");
  const [profileTwitter, setProfileTwitter] = useState("");
  const [profileTiktok, setProfileTiktok] = useState("");
  const [profileIsPrivate, setProfileIsPrivate] = useState(false);
  const [displayedMedal, setDisplayedMedal] = useState<string|null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{type:string;text:string}>({type:"",text:""});
  const [profileData, setProfileData] = useState<any>(null);
  const [profileReactions, setProfileReactions] = useState<{emoji:string;count:number}[]>([]);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{type:string;text:string}>({type:"",text:""});
  const [deleteAccModal, setDeleteAccModal] = useState(false);
  const [deleteAccPw, setDeleteAccPw] = useState("");
  const [deleteAccLoading, setDeleteAccLoading] = useState(false);
  const [deleteAccError, setDeleteAccError] = useState("");
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteAllPw, setDeleteAllPw] = useState("");
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPwModal, setExportPwModal] = useState(false);
  const [exportPw, setExportPw] = useState("");
  const [exportPwError, setExportPwError] = useState("");
  const [appTheme, setAppTheme] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("catatanku_app_theme") || "default";
    return "default";
  });
  useEffect(() => {
    const el = document.documentElement;
    const THEMES: Record<string, Record<string, string>> = {
      default: {},
      sage: {
        "--bg":"#F2F7F4","--surface":"#FFFFFF","--header-bg":"rgba(242,247,244,0.93)",
        "--ink":"#1E2E24","--ink2":"#5A7A64","--ink3":"#94B49A",
        "--accent":"#4A8A64","--accent-soft":"#C4DED0","--line":"#D0E4D8",
        "--shadow":"0 2px 20px rgba(30,46,36,0.06)",
        "--scroll-thumb":"#4A8A64","--scroll-track":"#C4DED0","--scroll-thumb-hover":"#37694d",
        "--surface2":"rgba(0,0,0,0.07)",
      },
      dark: {
        "--bg":"#282C34","--surface":"#21252B","--header-bg":"rgba(33,37,43,0.96)",
        "--ink":"#ABB2BF","--ink2":"#828997","--ink3":"#4B5263",
        "--accent":"#61AFEF","--accent-soft":"rgba(97,175,239,0.15)","--line":"#3E4451",
        "--shadow":"0 2px 20px rgba(0,0,0,0.3)",
        "--scroll-thumb":"#61AFEF","--scroll-track":"#3E4451","--scroll-thumb-hover":"#4d99d9",
        "--surface2":"rgba(255,255,255,0.08)",
      },
      ocean: {
        "--bg":"#EDF6FF","--surface":"#FFFFFF","--header-bg":"rgba(237,246,255,0.93)",
        "--ink":"#1A2E42","--ink2":"#4A6A8A","--ink3":"#7A9AB8",
        "--accent":"#3D7FBF","--accent-soft":"#C4DCF0","--line":"#B4CCE8",
        "--shadow":"0 2px 20px rgba(26,46,66,0.06)",
        "--scroll-thumb":"#3D7FBF","--scroll-track":"#C4DCF0","--scroll-thumb-hover":"#2e6498",
        "--surface2":"rgba(0,0,0,0.07)",
      },
      violet: {
        "--bg":"#1A1525","--surface":"#221D30","--header-bg":"rgba(26,21,37,0.96)",
        "--ink":"#E5E0F8","--ink2":"#A090C8","--ink3":"#6B5A90",
        "--accent":"#A78BFA","--accent-soft":"rgba(167,139,250,0.15)","--line":"#362D4A",
        "--shadow":"0 2px 20px rgba(0,0,0,0.35)",
        "--scroll-thumb":"#A78BFA","--scroll-track":"#362D4A","--scroll-thumb-hover":"#8B6FE8",
        "--surface2":"rgba(255,255,255,0.08)",
      },
    };
    const DEFAULT_VARS: Record<string, string> = {
      "--bg":"#FAF6F0","--surface":"#FFFFFF","--header-bg":"rgba(250,246,240,0.93)",
      "--ink":"#2E2520","--ink2":"#8C7E73","--ink3":"#BEB3A8",
      "--accent":"#C4956A","--accent-soft":"#EBDACB","--line":"#EDE7DF",
      "--shadow":"0 2px 20px rgba(46,37,32,0.05)",
      "--scroll-thumb":"#C4956A","--scroll-track":"#EBDACB","--scroll-thumb-hover":"#a87550",
      "--surface2":"rgba(0,0,0,0.07)",
    };
    const vars = appTheme === "default" ? DEFAULT_VARS : (THEMES[appTheme] || DEFAULT_VARS);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    if (appTheme === "default") el.removeAttribute("data-app-theme");
    else el.setAttribute("data-app-theme", appTheme);
    localStorage.setItem("catatanku_app_theme", appTheme);
  }, [appTheme]);
  const [defaultFont, setDefaultFont] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("catatanku_def_font") || "";
    return "";
  });
  const [defaultColor, setDefaultColor] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("catatanku_def_color") || "";
    return "";
  });
  const [defaultShareMusic, setDefaultShareMusic] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("catatanku_def_sharemusic") !== "false";
    return true;
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string|null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({x:0,y:0});
  const [cropImgSize, setCropImgSize] = useState({w:300,h:300});
  const cropDragRef = useRef({down:false,lx:0,ly:0,ox:0,oy:0});
  const cropPointersRef = useRef<Map<number,{x:number,y:number}>>(new Map());
  const cropPinchRef = useRef({startDist:0,baseScale:1});
  const cropImgRef = useRef<HTMLImageElement|null>(null);

  // Load profile when entering settings
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const d = await res.json();
        setProfileData(d);
        setProfileName(d.name || "");
        setProfileUsername(d.username || "");
        setProfileImage(d.image || "");
        setProfileTheme(d.profileTheme || "cocoa");
        if (d.medals) setDatabaseMedalIds(new Set(d.medals));
        if (d.companionType) setCompanionType(d.companionType);
        if (d.companionName) setCompanionName(d.companionName);
        setProfileBio(d.bio || "");
        setProfileInstagram(d.instagram || "");
        setProfileTwitter(d.twitter || "");
        setProfileTiktok(d.tiktok || "");
        setProfileIsPrivate(!!d.isPrivate);
        setDisplayedMedal(d.displayedMedal || null);
        if (typeof d.hasPassword === "boolean") setHasPassword(d.hasPassword);
        // Fetch reactions received
        fetch(`/api/users/${d.id}`).then(r => r.ok ? r.json() : null).then(rd => {
          if (rd?.reactions) setProfileReactions(rd.reactions);
        }).catch(()=>{});
      }
    } catch {}
  }, []);
  // Load profile on mount so avatar is available immediately
  useEffect(() => { loadProfile(); }, [loadProfile]);

  const saveProfile = useCallback(async () => {
    setProfileSaving(true);
    setProfileMsg({type:"",text:""});
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ 
          name: profileName, 
          image: profileImage, 
          profileTheme, 
          bio: profileBio,
          instagram: profileInstagram,
          twitter: profileTwitter,
          tiktok: profileTiktok,
          isPrivate: profileIsPrivate,
          displayedMedal: displayedMedal,
          ...(profileUsername.trim() ? { username: profileUsername } : {}) 
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setProfileData((p: any) => ({...p, ...d, isPrivate: profileIsPrivate, displayedMedal }));
        setProfileMsg({type:"ok",text:"Profil berhasil disimpan."});
      } else {
        setProfileMsg({type:"err",text:d.error||"Gagal menyimpan."});
      }
    } catch {
      setProfileMsg({type:"err",text:"Gagal menyimpan."});
    }
    setProfileSaving(false);
  }, [profileName, profileImage, profileTheme, profileUsername, profileBio, profileInstagram, profileTwitter, profileTiktok, profileIsPrivate, displayedMedal]);

  const savePassword = useCallback(async () => {
    if (!pwCurrent || !pwNew || !pwConfirm) { setPwMsg({type:"err",text:"Isi semua kolom."}); return; }
    if (pwNew !== pwConfirm) { setPwMsg({type:"err",text:"Konfirmasi kata sandi tidak cocok."}); return; }
    if (pwNew.length < 6) { setPwMsg({type:"err",text:"Kata sandi minimal 6 karakter."}); return; }
    setPwSaving(true); setPwMsg({type:"",text:""});
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const d = await res.json();
      if (res.ok) {
        setPwMsg({type:"ok",text:"Kata sandi berhasil diubah."});
        setPwCurrent(""); setPwNew(""); setPwConfirm("");
      } else {
        setPwMsg({type:"err",text:d.error||"Gagal mengubah kata sandi."});
      }
    } catch { setPwMsg({type:"err",text:"Gagal mengubah kata sandi."}); }
    setPwSaving(false);
  }, [pwCurrent, pwNew, pwConfirm]);

  const doDeleteAccount = useCallback(async () => {
    if (!deleteAccPw) { setDeleteAccError("Masukkan kata sandi."); return; }
    setDeleteAccLoading(true); setDeleteAccError("");
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ password: deleteAccPw }),
      });
      const d = await res.json();
      if (res.ok) {
        localStorage.clear();
        await signOut();
      } else {
        setDeleteAccError(d.error || "Gagal menghapus akun.");
      }
    } catch { setDeleteAccError("Gagal menghapus akun."); }
    setDeleteAccLoading(false);
  }, [deleteAccPw]);

  const doDeleteAll = useCallback(async () => {
    if (!deleteAllPw) { setDeleteAllError("Masukkan kata sandi."); return; }
    setDeleteAllLoading(true); setDeleteAllError("");
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ password: deleteAllPw }),
      });
      const d = await res.json();
      if (!d.verified) { setDeleteAllError("Kata sandi salah."); setDeleteAllLoading(false); return; }
      const ids = Object.keys(entriesRef.current);
      await Promise.all(ids.map(id => fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: {"X-CSRF-Token": csrfRef.current} }).catch(()=>{})));
      setEntries({});
      localStorage.setItem("catatanku_entries", "{}");
      setDeleteAllModal(false);
      setDeleteAllPw("");
      nav("home");
    } catch { setDeleteAllError("Gagal menghapus catatan."); }
    setDeleteAllLoading(false);
  }, [deleteAllPw, nav]);

  const doExport = useCallback(async (ids?: string[]) => {
    if (!exportPw.trim()) { setExportPwError("Masukkan kata sandi."); return; }
    setExportLoading(true);
    setExportPwError("");
    try {
      const verify = await fetch("/api/auth/verify-password", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ password: exportPw }) });
      const vd = await verify.json();
      if (!vd.verified) { setExportPwError("Kata sandi salah."); setExportLoading(false); return; }
      
      const res = await fetch("/api/user/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `catatanku-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportPwModal(false);
      setExportConfirmModal(false);
      setExportPw("");
      if (typeof window !== "undefined") {
        localStorage.setItem("catatanku_export_done", "1");
        setExportDone(true);
      }
    } catch { setExportPwError("Gagal mengekspor data."); }
    setExportLoading(false);
  }, [exportPw]);

  const saveCompanion = useCallback(async (type: string, name: string) => {
    setCompanionSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companionType: type, companionName: name })
      });
      if (res.ok) {
        setCompanionType(type);
        setCompanionName(name);
      }
    } catch {}
    setCompanionSaving(false);
  }, []);

  const changeCompanionName = useCallback((newName: string) => {
    setCompanionName(newName);
    // Debounce or just save on blur — for now let's save when they pick or rename
  }, []);

  const handleImportClick = useCallback(() => {
    importFileRef.current?.click();
  }, []);

  const onImportFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (files.length === 0) return;
    
    if ((e.target.files?.length || 0) > 5) {
      showInfoToast("Maksimal 5 file sekaligus. Hanya 5 file pertama yang akan diproses.");
    }

    const allNotes: any[] = [];
    const owners: {name:string;email:string}[] = [];
    let processedFiles = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const text = ev.target?.result as string;
          const rawData = JSON.parse(text);
          
          let notesArr: any[] = [];
          let owner: any = null;

          if (Array.isArray(rawData)) {
            notesArr = rawData;
          } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.notes)) {
            notesArr = rawData.notes;
            owner = rawData.owner;
          }

          if (notesArr.length > 0) {
            allNotes.push(...notesArr.map((n: any) => ({
              ...n,
              _preview: getPreviewText(n.text || "")
            })));
          }
          if (owner && !owners.find(o => o.email === owner.email)) {
            owners.push(owner);
          }
        } catch (err) {}

        processedFiles++;
        if (processedFiles === files.length) {
          if (allNotes.length === 0) {
            showInfoToast("Tidak ada catatan valid yang ditemukan di file terpilih.");
            return;
          }
          setImportData(allNotes);
          setSelectedImportIndices(new Set(allNotes.map((_: any, i: number) => i)));
          setImportAllOwners(owners);
          
          if (owners.length === 1) setImportOwner(owners[0]);
          else if (owners.length > 1) setImportOwner({ name: `${owners[0].name} + ${owners.length - 1} lainnya`, email: "Multi-Source" });
          else setImportOwner(null);

          setImportConfirmModal(true);
          setShowOwnerList(false); // Reset list visibility
          setImportError("");
        }
      };
      reader.readAsText(file);
    });
    
    e.target.value = "";
  }, []);

  const confirmImport = useCallback(async () => {
    setImportLoading(true);
    setImportError("");
    try {
      const res = await fetch("/api/notes/import", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfRef.current
        },
        body: JSON.stringify({ notes: importData.filter((_: any, i: number) => selectedImportIndices.has(i)) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal impor.");
      
      setImportConfirmModal(false);
      setImportData([]);
      
      // Refresh notes
      const r = await fetch("/api/notes");
      if (r.ok) {
        const notes = await r.json();
        const nObj: any = {};
        notes.forEach((n: any) => nObj[n.id] = n);
        setEntries(nObj);
        localStorage.setItem("catatanku_entries", JSON.stringify(nObj));
      }
      
      showInfoToast("Berhasil mengimpor " + d.count + " catatan!");
    } catch (err: any) {
      setImportError(err.message || "Gagal impor catatan.");
    }
    setImportLoading(false);
  }, [importData, selectedImportIndices]);

  const uploadAvatar = useCallback(async (file: File) => {
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/notes/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setProfileImage(d.url);
      // Persist image URL to database immediately
      const saveRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: d.url }),
      });
      if (!saveRes.ok) throw new Error();
      const saved = await saveRes.json();
      setProfileData((prev: any) => ({ ...prev, image: saved.image }));
      setProfileMsg({ type: "ok", text: "Foto profil berhasil diperbarui." });
    } catch {
      setProfileMsg({type:"err",text:"Gagal upload foto."});
    }
    setAvatarUploading(false);
  }, []);

  const CROP_SIZE = 260;
  const clampCropOffset = useCallback((ox: number, oy: number, scale: number, imgW: number, imgH: number) => {
    const maxX = Math.max(0, (imgW * scale - CROP_SIZE) / 2);
    const maxY = Math.max(0, (imgH * scale - CROP_SIZE) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) };
  }, []);

  const onCropPointerDown = useCallback((e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    cropPointersRef.current.set(e.pointerId, {x:e.clientX, y:e.clientY});
    const pts = Array.from(cropPointersRef.current.values());
    if (pts.length === 1) {
      setCropOffset(prev => {
        cropDragRef.current = { down:true, lx:e.clientX, ly:e.clientY, ox:prev.x, oy:prev.y };
        return prev;
      });
    } else if (pts.length >= 2) {
      cropDragRef.current.down = false;
      cropPinchRef.current = { startDist: Math.hypot(pts[1].x-pts[0].x, pts[1].y-pts[0].y), baseScale: cropScale };
    }
  }, [cropScale]);

  const onCropPointerMove = useCallback((e: React.PointerEvent) => {
    if (!cropPointersRef.current.has(e.pointerId)) return;
    cropPointersRef.current.set(e.pointerId, {x:e.clientX, y:e.clientY});
    const pts = Array.from(cropPointersRef.current.values());
    if (pts.length >= 2) {
      const dist = Math.hypot(pts[1].x-pts[0].x, pts[1].y-pts[0].y);
      const ratio = cropPinchRef.current.startDist > 0 ? dist / cropPinchRef.current.startDist : 1;
      const next = Math.max(1, Math.min(4, cropPinchRef.current.baseScale * ratio));
      setCropScale(next);
      setCropOffset(prev => clampCropOffset(prev.x, prev.y, next, cropImgSize.w, cropImgSize.h));
    } else if (cropDragRef.current.down) {
      const dx = e.clientX - cropDragRef.current.lx;
      const dy = e.clientY - cropDragRef.current.ly;
      setCropOffset(clampCropOffset(cropDragRef.current.ox+dx, cropDragRef.current.oy+dy, cropScale, cropImgSize.w, cropImgSize.h));
    }
  }, [cropScale, cropImgSize, clampCropOffset]);

  const onCropPointerUp = useCallback((e: React.PointerEvent) => {
    cropPointersRef.current.delete(e.pointerId);
    const pts = Array.from(cropPointersRef.current.values());
    if (pts.length === 1) {
      // Transition back to drag with remaining finger
      setCropOffset(prev => {
        cropDragRef.current = { down:true, lx:pts[0].x, ly:pts[0].y, ox:prev.x, oy:prev.y };
        return prev;
      });
    } else {
      cropDragRef.current.down = false;
    }
  }, []);

  const confirmCrop = useCallback(async () => {
    const img = cropImgRef.current;
    if (!cropSrc || !img) return;
    const CANVAS = 512;
    const PREVIEW = CROP_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS; canvas.height = CANVAS;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath(); ctx.arc(CANVAS/2, CANVAS/2, CANVAS/2, 0, Math.PI*2); ctx.clip();
    const ratio = CANVAS / PREVIEW;
    const dw = cropImgSize.w * cropScale * ratio;
    const dh = cropImgSize.h * cropScale * ratio;
    const dx = (CANVAS - dw) / 2 + cropOffset.x * ratio;
    const dy = (CANVAS - dh) / 2 + cropOffset.y * ratio;
    ctx.drawImage(img, dx, dy, dw, dh);
    canvas.toBlob(async blob => {
      if (!blob) return;
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      await uploadAvatar(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }, [cropSrc, cropScale, cropOffset, cropImgSize, uploadAvatar]);

  const monthEntries = useMemo(() => Object.values(entries).filter((e: any) => {
    const d=new Date(e.date+"T00:00:00");
    return d.getMonth()===cM && d.getFullYear()===cY && e.text?.trim();
  }), [entries, cM, cY]);
  const moodCounts: Record<number, number> = useMemo(() => {
    const res: Record<number, number> = {};
    monthEntries.forEach((e: any) => { if(e.mood!=null) res[e.mood]=(res[e.mood]||0)+1; });
    return res;
  }, [monthEntries]);

  if(!loaded) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)",fontFamily:"'Cormorant Garamond',serif",overflow:"hidden",position:"relative"}}>
      <style>{`
        @keyframes ldFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ldFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes ldDot{0%,80%,100%{opacity:.18;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
        @keyframes ldLine{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes ldBgPulse{0%,100%{opacity:.4}50%{opacity:.65}}
      `}</style>

      {/* Soft ambient blobs */}
      <div style={{position:"absolute",top:"12%",right:"18%",width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,var(--accent-soft),transparent 70%)",animation:"ldBgPulse 4s ease infinite",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"14%",left:"14%",width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,var(--accent-soft),transparent 70%)",animation:"ldBgPulse 4s ease 1.5s infinite",pointerEvents:"none"}}/>

      {/* Floating icon */}
      <div style={{marginBottom:28,animation:"ldFloat 3.2s ease-in-out infinite",opacity:.85}}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      </div>

      {/* Wordmark */}
      <h1 style={{fontSize:"clamp(2rem,6vw,3rem)",fontWeight:300,color:"var(--ink)",letterSpacing:"-.01em",lineHeight:1,margin:"0 0 10px",animation:"ldFadeUp .9s cubic-bezier(.16,1,.3,1) both"}}>
        Catatanku
      </h1>

      {/* Accent line */}
      <div style={{width:36,height:2,borderRadius:1,background:"var(--accent)",marginBottom:12,transformOrigin:"left",animation:"ldLine .8s cubic-bezier(.16,1,.3,1) .35s both"}}/>

      {/* Tagline */}
      <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",letterSpacing:".07em",marginBottom:44,animation:"ldFadeUp .9s cubic-bezier(.16,1,.3,1) .2s both"}}>
        Ruang ceritamu
      </p>

      {/* Staggered dots */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"var(--accent)",animation:`ldDot 1.5s ease ${i*.18}s infinite`}}/>
        ))}
      </div>
    </div>
  );

  if ((session?.user as any)?.suspended) return (
    <div style={{ minHeight:"100vh", background:"#FAF6F0", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lora',serif" }}>
      <div style={{ textAlign:"center", padding:"40px 24px", maxWidth:380 }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"#FFEDED", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C05050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.7rem", fontWeight:600, color:"#2E2520", marginBottom:10 }}>Akunmu di-suspend</h2>
        <p style={{ fontSize:".88rem", color:"#8C7E73", lineHeight:1.65, marginBottom:(session?.user as any)?.suspendReason ? 16 : 28 }}>
          Akun kamu telah di-suspend oleh admin dan tidak bisa mengakses Catatanku untuk sementara. Hubungi admin jika ini adalah kesalahan.
        </p>
        {(session?.user as any)?.suspendReason && (
          <div style={{ background:"#FFF5F5", border:"1px solid #FFCDCD", borderRadius:10, padding:"12px 16px", marginBottom:28, textAlign:"left" }}>
            <p style={{ fontFamily:"'Lora',serif", fontSize:".72rem", color:"#B85050", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>Alasan Suspend</p>
            <p style={{ fontFamily:"'Lora',serif", fontSize:".86rem", color:"#6A4040", lineHeight:1.55, margin:0 }}>{(session?.user as any).suspendReason}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ padding:"11px 28px", borderRadius:50, border:"none", background:"#C4956A", color:"#fff", fontFamily:"'Lora',serif", fontSize:".88rem", cursor:"pointer" }}
        >
          Keluar
        </button>
      </div>
    </div>
  );

  if (status === "unauthenticated") return <AuthForm />;

  const isDarkApp = appTheme === "dark" || appTheme === "violet";

  const isReadingDarkTheme = (view==="read"||view==="write") && !!(readNoteTheme as any)?.dark;
  const isReadingLightTheme = (view==="read"||view==="write") && !!(readNoteTheme?.bg || readNoteColor?.bg) && !(readNoteTheme as any)?.dark;
  const lightNoteBg = readNoteTheme?.bg || readNoteColor?.bg || "#FAF6F0";
  // Dark note theme: use a proper dark-glass surface so modals/dropdowns stay readable
  const darkNoteSurface = readNoteTheme?.id === "kota_malam" ? "rgba(8,14,22,0.88)" : "rgba(12,26,24,0.88)";
  const readingThemeOverrides: Record<string,string> = isReadingDarkTheme
    ? {"--ink":"#FFFFFF","--ink2":"rgba(255,255,255,.85)","--ink3":"rgba(255,255,255,.60)","--header-bg":`${readNoteTheme?.bg}E8`||"rgba(2,4,8,0.92)","--line":"rgba(255,255,255,.14)","--surface":darkNoteSurface,"--surface2":"rgba(255,255,255,0.10)","--accent-soft":"rgba(255,255,255,0.10)","--bg":readNoteTheme?.bg||"#020408"}
    : (isReadingLightTheme && isDarkApp)
      ? {"--ink":"#000000","--ink2":"#111111","--ink3":"#333333","--header-bg":`${lightNoteBg}ED`,"--line":"rgba(0,0,0,.12)","--surface":"rgba(255,255,255,0.92)","--surface2":"rgba(0,0,0,0.07)","--accent-soft":"rgba(0,0,0,0.06)","--bg":lightNoteBg}
      : {};

  return (
    <div className={focusMode?"focus-mode":""} style={{minHeight:"100vh",background:(view==="read"||view==="write")?(readNoteTheme?.bg||readNoteColor?.bg||(isDarkApp?null:readMood?.pageBg)||"var(--bg)"):"var(--bg)",color:"var(--ink)",transition:"background .5s ease",position:"relative",...readingThemeOverrides} as any}>
      {(view==="read"||view==="write") && readNoteTheme && <ThemeBg themeId={readNoteTheme.id} accent={readNoteTheme.accent}/>}
      <style>{`


        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        body{background:var(--bg);overflow-x:hidden}
        .pg-in{animation:pgIn .45s cubic-bezier(.23,1,.32,1) both}
        .pg-out{animation:pgOut .2s ease both}
        @media print {
          @page { margin: 0; }
          body { background: ${(view==="read"||view==="write")?(readNoteTheme?.bg||readNoteColor?.bg||readMood?.soft||"white"):"white"} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; }
          .no-print, header, .desk-header, .mob-nav, .mob-nav-new, button, .ddrop, .asheet-row, .desk-selesai-fab { display: none !important; }
          .read-layout { margin: 0 !important; padding: 48px 40px !important; width: 100% !important; min-height: 0 !important; position: relative !important; z-index: 1 !important; background: transparent !important; }
          .shell { padding: 0 !important; margin: 0 !important; min-height: 0 !important; background: transparent !important; position: relative !important; z-index: 1 !important; }
          .read-layout > * { animation: none !important; transform: none !important; }
          
          .theme-bg-svg { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 0 !important; opacity: 0.15 !important; display: block !important; }
        }
        @keyframes pgIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pgOut{from{opacity:1}to{opacity:0;transform:translateY(-6px)}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stTabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalBgIn{from{opacity:0}to{opacity:1}}
        @keyframes modalBgOut{from{opacity:1}to{opacity:0}}
        @keyframes modalIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes modalOut{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(.98) translateY(-4px)}}
        @keyframes flameFlicker{0%,100%{transform:scaleX(1) scaleY(1) rotate(0deg)}20%{transform:scaleX(.96) scaleY(1.04) rotate(-1.5deg)}40%{transform:scaleX(1.03) scaleY(.97) rotate(1deg)}60%{transform:scaleX(.97) scaleY(1.03) rotate(-1deg)}80%{transform:scaleX(1.02) scaleY(.98) rotate(.8deg)}}
        @keyframes flamePulse{0%,100%{filter:drop-shadow(0 0 4px rgba(255,140,0,.35))}50%{filter:drop-shadow(0 0 11px rgba(255,140,0,.65))}}
        @keyframes streakAtRisk{0%,100%{box-shadow:0 0 0 0 rgba(255,140,0,0)}50%{box-shadow:0 0 0 6px rgba(255,140,0,.18)}}
        @keyframes sparkle{0%{opacity:1;transform:scale(0) translateY(0) rotate(0deg)}60%{opacity:1;transform:scale(1.2) translateY(-28px) rotate(120deg)}100%{opacity:0;transform:scale(.5) translateY(-48px) rotate(240deg)}}
        @keyframes milestoneGlow{0%,100%{box-shadow:0 4px 16px rgba(196,149,106,.15)}50%{box-shadow:0 4px 32px rgba(255,165,0,.45)}}
        .s1{animation:fadeUp .5s ease .04s both}.s2{animation:fadeUp .5s ease .1s both}.s3{animation:fadeUp .5s ease .18s both}.s4{animation:fadeUp .5s ease .27s both}.s5{animation:fadeUp .5s ease .36s both}
        .gb{background:none;border:none;cursor:pointer;color:var(--ink2);font-family:'Lora',serif;font-size:.86rem;transition:color .2s;display:inline-flex;align-items:center;gap:6px}
        .gb:hover{color:var(--ink)}
        .ecard{padding:18px 22px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--line);cursor:pointer;transition:transform .25s cubic-bezier(.23,1,.32,1),box-shadow .25s cubic-bezier(.23,1,.32,1),border-color .2s ease;position:relative;overflow:hidden;content-visibility:auto;contain-intrinsic-size:0 120px}
        .ecard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--card-accent,var(--accent-soft));border-radius:var(--radius) 0 0 var(--radius);transition:width .25s ease}
        .ecard:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(46,37,32,.08);border-color:var(--card-border,var(--accent-soft))}
        .ecard:hover::before{width:5px}
        .cal-day{width:40px;height:40px;border:none;background:none;border-radius:50%;font-family:'Lora',serif;font-size:.86rem;color:var(--ink);cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;position:relative}
        .cal-day:hover{background:var(--accent-soft)}
        .fab{position:fixed;bottom:28px;right:28px;width:56px;height:56px;border-radius:50%;border:none;background:var(--accent);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 28px rgba(196,149,106,.3);transition:all .3s;z-index:50}
        .fab:hover{transform:scale(1.08) rotate(90deg);box-shadow:0 8px 32px rgba(196,149,106,.42)}
        .mood-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px 6px 10px;border-radius:24px;font-family:'Lora',serif;font-size:.8rem;transition:all .25s ease;cursor:pointer;border:1px solid var(--line);background:var(--surface)}
        .mood-chip:hover{transform:scale(1.05)}
        textarea{width:100%;border:none;outline:none;resize:none;background:transparent;font-family:'Lora',serif;font-size:1.05rem;line-height:2.1;color:var(--ink);min-height:260px}
        textarea::placeholder{color:var(--ink3);font-style:italic}
        input[type="text"]{width:100%;border:none;outline:none;background:transparent;font-family:'Cormorant Garamond',serif;color:var(--ink)}
        input[type="text"]::placeholder{color:var(--ink3)}
        .toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-8px);font-family:'Lora',serif;font-size:.78rem;color:var(--accent);opacity:0;transition:opacity .3s,transform .3s cubic-bezier(.23,1,.32,1);pointer-events:none;z-index:400;background:var(--surface);padding:6px 18px;border-radius:24px;border:1px solid var(--accent-soft);letter-spacing:.02em;box-shadow:0 4px 16px rgba(196,149,106,.18)}
        .toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
        .search-bar{width:100%;padding:12px 16px 12px 42px;border:1px solid var(--line);border-radius:12px;background:var(--surface);font-family:'Lora',serif;font-size:.9rem;color:var(--ink);outline:none;transition:border-color .2s}
        .search-bar:focus{border-color:var(--accent-soft)}
        .tag-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-family:'Lora',serif;font-size:.68rem;background:var(--accent-soft);color:var(--accent);border:1px solid var(--line);cursor:pointer;transition:all .12s;white-space:nowrap;line-height:1.6}
        .tag-chip:hover{background:rgba(196,149,106,.22)}
        .tag-chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
        .tag-filter-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;scrollbar-width:none}
        .tag-filter-row::-webkit-scrollbar{display:none}
        .tag-input{width:100%;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);font-family:'Lora',serif;font-size:.78rem;color:var(--ink);outline:none;transition:border-color .2s}
        .tag-input:focus{border-color:var(--accent)}
        .desk-search-wrap{display:none}
        @media(min-width:768px){.desk-search-wrap{display:block;position:relative;flex:1;max-width:320px}}
        .line-h{height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent)}
        .shell{padding:28px 24px 100px}
        .home-hero{display:flex;flex-direction:column;gap:24px;margin-bottom:36px}
        .home-grid{display:grid;grid-template-columns:1fr;gap:12px}
        .write-layout{display:flex;flex-direction:column}
        .write-sidebar{margin-bottom:28px}
        .write-main{flex:1}
        .read-layout{max-width:640px;position:relative}
        .cal-layout{display:flex;flex-direction:column;gap:28px}
        .cal-grid-wrap{flex:1}
        .cal-sidebar{display:none}
        .list-grid{display:grid;grid-template-columns:1fr;gap:10px}
        .mood-grid{display:flex;overflow-x:auto;gap:10px;padding:4px 0 12px;margin:0 -4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .mood-grid::-webkit-scrollbar{display:none}
        .mood-grid .mood-chip{flex-shrink:0;justify-content:center;padding:10px 16px;font-size:.82rem}
        .mood-col{display:none;flex-direction:column;gap:8px}
        .mood-col .mood-chip{justify-content:flex-start}
        .today-count{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;font-family:'Lora',serif;font-size:.65rem;font-weight:600;background:var(--accent-soft);color:var(--accent)}
        .del-icon{padding:4;opacity:.25;transition:opacity .2s,color .2s;color:var(--ink3)}
        .del-icon:hover{opacity:1;color:#C27054}
        .locked-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);z-index:2;border-radius:inherit}
        .modal-bg{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:${isReadingDarkTheme?"rgba(0,0,0,0.55)":isDarkApp?"rgba(0,0,0,0.55)":"rgba(46,37,32,0.38)"};backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:2000;animation:modalBgIn .18s ease both;contain:strict;transform:translateZ(0)}
        .modal{background:var(--surface);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);width:100%;max-width:360px;border-radius:24px;box-shadow:${isReadingDarkTheme||isDarkApp?"0 12px 48px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.12)":"0 12px 40px rgba(46,37,32,0.14)"};animation:modalIn .28s cubic-bezier(.16,1,.3,1) both;border:1px solid ${isReadingDarkTheme||isDarkApp?"rgba(255,255,255,0.14)":"var(--line)"};padding:40px 32px;position:relative;text-align:center;will-change:transform,opacity}
        .modal-closing{animation:modalOut .18s cubic-bezier(.4,0,1,1) both!important}
        .blur-card{filter:blur(10px);pointer-events:none;user-select:none}
        @media(min-width:768px){
          .shell{padding:102px 48px 100px;max-width:1200px;margin:0 auto}
          .home-hero{flex-direction:row;align-items:flex-start;gap:48px}
          .home-hero-left{flex:1}.home-hero-right{width:380px;flex-shrink:0}
          .home-grid{grid-template-columns:repeat(3,1fr);gap:16px}
          .write-layout{flex-direction:column;gap:0}
          .write-sidebar{display:none!important}
          .write-main{flex:1;max-width:720px;width:100%}
          .mood-grid{display:none}.mood-col{display:flex}
          .read-layout{max-width:720px;margin:0 auto}
          .cal-layout{flex-direction:row;gap:40px}
          .cal-sidebar{display:block;width:240px;flex-shrink:0}
          .list-grid{grid-template-columns:repeat(2,1fr);gap:16px}
        }
        @media(min-width:1024px){
          .shell{padding:108px 64px 100px;max-width:1200px}
          .home-grid{grid-template-columns:repeat(3,1fr);gap:18px}
          .list-grid{grid-template-columns:repeat(3,1fr);gap:18px}
        }
        @media(min-width:1280px){
          .shell{padding:108px 80px 100px;max-width:1440px}
          .home-grid{grid-template-columns:repeat(4,1fr);gap:18px}
          .list-grid{grid-template-columns:repeat(4,1fr);gap:16px}
          .home-hero-right{width:420px}
        }
        @media(max-width:480px){
          .cal-day{width:36px;height:36px;font-size:.8rem}
          .shell{padding:20px 16px 100px}
          .mood-grid{gap:8px;padding-bottom:10px}
          .mood-grid .mood-chip{padding:9px 14px;font-size:.78rem;gap:5px}
        }
        /* ── Mobile helpers ─── */
        .desk-only{display:none!important}
        @media(min-width:768px){.desk-only{display:flex!important}}
        .desk-selesai-fab{position:fixed;bottom:28px;right:28px;z-index:300;align-items:center;gap:9px;padding:13px 28px;border-radius:14px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-family:'Lora',serif;font-size:.9rem;font-weight:500;letter-spacing:.01em;box-shadow:0 6px 24px rgba(196,149,106,.38);transition:transform .25s cubic-bezier(.23,1,.32,1),box-shadow .25s cubic-bezier(.23,1,.32,1);animation:fabIn .35s cubic-bezier(.23,1,.32,1) both}
        .mob-only{display:flex!important}
        @media(min-width:768px){.mob-only{display:none!important}}
        /* ── Mobile bottom nav ─── */
        .mob-nav{position:fixed;bottom:0;left:0;right:0;height:66px;background:var(--surface);border-top:1px solid var(--line);z-index:200;display:flex;align-items:stretch;padding-bottom:env(safe-area-inset-bottom,0px);will-change:transform;contain:layout style}
        @media(min-width:768px){.mob-nav{display:none}}
        .mob-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:none;background:none;cursor:pointer;padding:8px 2px;color:var(--ink3);transition:color .15s;-webkit-tap-highlight-color:transparent}
        .mob-nav-btn.act{color:var(--accent)}
        .mob-nav-btn .mlbl{font-family:'Lora',serif;font-size:.56rem;line-height:1;transition:color .15s}
        .mob-nav-ctr{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:none;background:none;cursor:pointer;padding:6px 2px;-webkit-tap-highlight-color:transparent}
        .mob-nav-ctr-ico{width:48px;height:34px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 14px rgba(196,149,106,.45);transition:transform .15s,box-shadow .15s;will-change:transform}
        .mob-nav-ctr:active .mob-nav-ctr-ico{transform:scale(.91);box-shadow:0 2px 8px rgba(196,149,106,.3)}
        .mob-nav-ctr .mlbl{font-family:'Lora',serif;font-size:.56rem;line-height:1;color:var(--accent);font-weight:600}
        @media(max-width:767px){
          .shell{padding-bottom:86px!important}
          .write-sidebar{display:none!important}
          .fab{display:none!important}
          .blk-ctrl{opacity:1!important}
        }
        /* ── Multi-select bar ── */
        .sel-bar{position:fixed;left:16px;right:16px;bottom:calc(66px + env(safe-area-inset-bottom,0px) + 10px);z-index:210;display:flex;align-items:stretch;background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,.14),0 2px 8px rgba(0,0,0,.07);animation:fadeUp .2s ease both;overflow:hidden}
        .sel-bar-count{font-family:'Lora',serif;font-size:.82rem;color:var(--ink2);padding:13px 16px;flex:1;display:flex;align-items:center;justify-content:center}
        .sel-bar-div{width:1px;background:var(--line);flex-shrink:0}
        .sel-bar-btn{font-family:'Lora',serif;font-size:.8rem;padding:13px 16px;border:none;background:none;color:var(--ink2);cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent;flex:1}
        .sel-bar-btn:hover{background:var(--bg)}
        .sel-bar-del{font-family:'Lora',serif;font-size:.8rem;padding:13px 16px;border:none;background:#C04040;color:#fff;cursor:pointer;font-weight:600;transition:background .12s;-webkit-tap-highlight-color:transparent;flex:1}
        .sel-bar-del:hover{background:#A83535}
        @media(min-width:768px){.sel-bar{left:0;right:0;transform:none;width:max-content;min-width:360px;margin:0 auto;bottom:32px;border-radius:32px}}
        /* ── Action / Style bottom sheet ─── */
        .asheet-bg{position:fixed;inset:0;background:${isReadingDarkTheme||isDarkApp?"rgba(0,0,0,.45)":"rgba(46,37,32,.22)"};backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:899}
        .asheet{position:fixed;left:0;right:0;bottom:0;background:var(--surface);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border-radius:22px 22px 0 0;padding:0 0 max(28px,env(safe-area-inset-bottom,28px));z-index:900;animation:slideUp .3s cubic-bezier(.16,1,.3,1) both;box-shadow:${isReadingDarkTheme||isDarkApp?"0 -12px 48px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.1) inset":"0 -12px 48px rgba(46,37,32,.12)"}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .asheet-title{font-family:'Lora',serif;font-size:.72rem;color:var(--ink3);text-transform:uppercase;letter-spacing:.08em;padding:8px 22px 12px;font-weight:500}
        .asheet-row{display:flex;align-items:center;gap:14px;width:100%;padding:15px 22px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.9rem;color:var(--ink);text-align:left;-webkit-tap-highlight-color:transparent;transition:background .1s}
        .asheet-row:active{background:var(--bg)}
        .asheet-sep{height:1px;background:var(--line);margin:4px 0}
        .asheet-danger{color:#B5705A!important}
        /* ── Write toolbar (desktop) ── */
        .write-toolbar{display:none}
        @media(min-width:768px){
          .write-toolbar{display:flex;align-items:center;gap:2px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--line);padding:8px 0;margin-bottom:28px;position:sticky;top:62px;z-index:100;background:var(--bg)}
          .write-toolbar::-webkit-scrollbar{display:none}
        }
        .wtbtn{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.78rem;color:var(--ink2);border-radius:9px;transition:background .15s,color .15s,transform .1s;white-space:nowrap;flex-shrink:0}
        .wtbtn:hover{background:rgba(196,149,106,.12);color:var(--ink);transform:translateY(-1px)}
        .wtbtn:active{transform:translateY(0)!important}
        .wtbtn.wact{color:var(--accent);background:rgba(196,149,106,.14);font-weight:500}
        .wtbtn:disabled{opacity:.35;cursor:default;transform:none!important}
        .write-title-inp{width:100%;padding:4px 0 12px;border:none;border-bottom:1.5px solid var(--line);background:transparent;color:var(--ink);outline:none;transition:border-color .25s ease;display:block;box-sizing:border-box}
        .write-title-inp:focus{border-bottom-color:var(--accent)}
        .write-title-inp::placeholder{color:var(--ink3);font-style:italic}
        @keyframes fabIn{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        .wdrop-wrap{flex-shrink:0}
        .wdrop{position:fixed;min-width:200px;max-height:340px;overflow-y:auto;background:var(--surface);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border:1px solid ${isReadingDarkTheme?"rgba(255,255,255,0.15)":"var(--line)"};border-radius:14px;box-shadow:${isReadingDarkTheme?"0 8px 36px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.08)":"0 8px 36px rgba(46,37,32,.12)"};z-index:500;padding:10px;animation:fadeUp .18s ease both}
        .wdrop::-webkit-scrollbar{width:4px}
        .wdrop::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
        .wdrop-label{font-family:'Lora',serif;font-size:.65rem;color:var(--ink3);letter-spacing:.06em;text-transform:uppercase;padding:2px 6px 6px;display:block}
        /* ── Desktop sticky header ── */
        .desk-header{display:none}
        @media(min-width:768px){
          .desk-header{display:flex;position:fixed;top:0;left:0;right:0;height:62px;background:var(--header-bg);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid var(--line);z-index:200;align-items:center;padding:0 48px}
        }
        @media(min-width:1024px){.desk-header{padding:0 64px}}
        @media(min-width:1280px){.desk-header{padding:0 80px}}
        .desk-header-inner{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:1440px;margin:0 auto;gap:16px}
        .desk-tab{display:flex;align-items:center;gap:6px;padding:7px 13px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.82rem;color:var(--ink2);border-radius:10px;transition:all .15s;letter-spacing:.01em;white-space:nowrap}
        .desk-tab:hover{color:var(--ink);background:rgba(196,149,106,.1)}
        .desk-tab.act{color:var(--accent);background:rgba(196,149,106,.14);font-weight:500}
        .desk-hdr-sep{width:1px;height:18px;background:var(--line);flex-shrink:0}
        /* ── Desktop dropdown menu ── */
        .ddrop{position:relative;display:inline-flex}
        .ddrop-btn{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--line);border-radius:9px;background:var(--surface);cursor:pointer;font-family:'Lora',serif;font-size:.8rem;color:var(--ink2);transition:all .15s;white-space:nowrap}
        .ddrop-btn:hover{border-color:var(--accent-soft);color:var(--ink);background:var(--bg)}
        .ddrop-menu{position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--line);border-radius:13px;box-shadow:0 8px 32px rgba(46,37,32,.12);min-width:200px;padding:6px;z-index:300;animation:ddIn .18s cubic-bezier(.16,1,.3,1) both}
        @keyframes ddIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .ddrop-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 13px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.84rem;color:var(--ink);border-radius:8px;transition:background .12s;text-align:left;white-space:nowrap}
        .ddrop-item:hover{background:var(--bg)}
        .ddrop-item.active{color:var(--accent)}
        .ddrop-item.danger{color:#B5705A}
        .ddrop-item.danger:hover{background:#FEF5F1}
        .ddrop-sep{height:1px;background:var(--line);margin:4px 6px}
        /* ── Desktop home stats ── */
        .home-stats{display:none}
        @media(min-width:768px){.home-stats{display:flex;gap:32px;margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}}
        .stat-item{display:flex;flex-direction:column;gap:2px}
        .stat-val{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:300;color:var(--ink);line-height:1}
        .stat-lbl{font-family:'Lora',serif;font-size:.7rem;color:var(--ink3);letter-spacing:.04em}
        /* ── Focus mode ── */
        .focus-mode .desk-header{display:none!important}
        .focus-mode .mob-nav{display:none!important}
        .focus-mode .write-toolbar{display:none!important}
        .focus-mode .shell{padding:0!important;max-width:none!important}
        .focus-mode .write-layout{display:block}
        .focus-mode .write-sidebar{display:none!important}
        .focus-mode .write-main{max-width:680px;margin:0 auto;padding:60px 32px 120px}
        .focus-mode .read-layout{max-width:680px;margin:0 auto;padding:60px 32px 120px}
        @media(max-width:600px){.focus-mode .write-main,.focus-mode .read-layout{padding:48px 22px 120px}}
        .focus-exit-btn{position:fixed;top:18px;right:20px;z-index:500;display:flex;align-items:center;gap:6px;padding:7px 14px;background:var(--surface);border:1px solid var(--line);border-radius:10px;cursor:pointer;font-family:'Lora',serif;font-size:.75rem;color:var(--ink2);opacity:.55;transition:opacity .2s,background .15s;box-shadow:0 2px 8px rgba(0,0,0,.07)}
        .focus-exit-btn:hover{opacity:1;background:var(--bg)}
        .focus-wc{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:500;font-family:'Lora',serif;font-size:.7rem;color:var(--ink3);background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:5px 14px;pointer-events:none;opacity:.6;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.06)}
        @keyframes focusIn{from{opacity:0}to{opacity:1}}
        .focus-mode{animation:focusIn .35s ease both}

        /* ── Rich Read & Editor Styles ── */
        .rich-read h1,.blk-ce h1{font-size:1.7rem;font-weight:700;margin-top:1.2em;margin-bottom:.2em;line-height:1.25}
        .rich-read h2,.blk-ce h2{font-size:1.4rem;font-weight:700;margin-top:1em;margin-bottom:.2em;line-height:1.3}
        .rich-read h3,.blk-ce h3{font-size:1.15rem;font-weight:700;margin-top:.9em;margin-bottom:.15em;line-height:1.35}
        .rich-read h4,.blk-ce h4{font-size:1.05rem;font-weight:700;margin-top:.8em;margin-bottom:.1em;line-height:1.4}
        .rich-read strong{font-weight:700}
        .rich-read em{font-style:italic}
        .rich-read div{min-height:1.2em}
        .note-link {
          color: var(--accent);
          text-decoration: underline dotted;
          text-decoration-color: var(--accent-light);
          cursor: pointer;
          font-weight: 500;
          transition: all .2s;
          padding: 0 2px;
          margin: 0 -2px;
        }
        .note-link:hover {
          background: var(--accent-light);
          border-radius: 4px;
          text-decoration-style: solid;
        }

        .blk-ctrl{opacity:0!important}.blk-wrap:hover .blk-ctrl{opacity:1!important}.img-blk:hover .blk-ctrl{opacity:1!important}
        .fmt-btn:hover{background:var(--line)!important}
        [contenteditable]:empty:not(:focus)::before{content:attr(data-placeholder);color:var(--ink3);font-style:italic;pointer-events:none}
        @media(max-width:680px){.blk-ce{padding-right:0!important}}
      `}</style>

      {/* ── Avatar Crop Modal ── */}
      {cropSrc && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:10000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0}}>
          {/* Header */}
          <div style={{textAlign:"center",padding:"0 24px 24px",animation:"pgIn .25s cubic-bezier(.23,1,.32,1) both"}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.65rem",fontWeight:500,color:"#fff",margin:0,lineHeight:1.1}}>Sesuaikan Foto</h3>
            <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"rgba(255,255,255,.45)",margin:"6px 0 0"}}>Seret untuk posisi · Cubit untuk zoom</p>
          </div>

          {/* Crop circle */}
          <div style={{position:"relative",width:CROP_SIZE,height:CROP_SIZE,flexShrink:0,animation:"pgIn .3s cubic-bezier(.23,1,.32,1) both"}}>
            <div
              onPointerDown={onCropPointerDown}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerUp}
              onPointerCancel={onCropPointerUp}
              onWheel={e=>{
                e.preventDefault();
                const next = Math.max(1, Math.min(4, cropScale - e.deltaY * 0.0012));
                setCropScale(next);
                setCropOffset(prev => clampCropOffset(prev.x, prev.y, next, cropImgSize.w, cropImgSize.h));
              }}
              style={{width:CROP_SIZE,height:CROP_SIZE,borderRadius:"50%",overflow:"hidden",cursor:"grab",boxShadow:`0 0 0 9999px rgba(0,0,0,.92), 0 0 0 10002px rgba(196,149,106,.35)`,touchAction:"none",userSelect:"none",position:"relative",zIndex:1}}>
              <img
                ref={cropImgRef}
                src={cropSrc}
                alt=""
                draggable={false}
                onLoad={e=>{
                  const img = e.currentTarget;
                  cropImgRef.current = img;
                  const cover = Math.max(CROP_SIZE/img.naturalWidth, CROP_SIZE/img.naturalHeight);
                  setCropImgSize({w:img.naturalWidth*cover, h:img.naturalHeight*cover});
                  setCropScale(1);
                  setCropOffset({x:0,y:0});
                  cropPointersRef.current.clear();
                }}
                style={{
                  position:"absolute",
                  width: cropImgSize.w * cropScale,
                  height: cropImgSize.h * cropScale,
                  left: (CROP_SIZE - cropImgSize.w * cropScale) / 2 + cropOffset.x,
                  top: (CROP_SIZE - cropImgSize.h * cropScale) / 2 + cropOffset.y,
                  pointerEvents:"none",
                }}
              />
            </div>
            {/* Golden border ring */}
            <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"2.5px solid rgba(196,149,106,.6)",zIndex:2,pointerEvents:"none"}}/>
          </div>

          {/* Controls card */}
          <div style={{width:"100%",maxWidth:340,padding:"24px 20px 0",animation:"pgIn .35s cubic-bezier(.23,1,.32,1) both"}}>
            <div style={{background:"rgba(255,255,255,.07)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:22,border:"1px solid rgba(255,255,255,.1)",padding:"20px 20px 20px",display:"flex",flexDirection:"column",gap:18}}>
              {/* Zoom slider */}
              <div>
                <p style={{fontFamily:"'Lora',serif",fontSize:".62rem",color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:600,margin:"0 0 10px"}}>Zoom</p>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="range" min={1} max={4} step={0.01} value={cropScale}
                    onChange={e=>{
                      const s=Number(e.target.value);
                      setCropScale(s);
                      setCropOffset(prev=>clampCropOffset(prev.x,prev.y,s,cropImgSize.w,cropImgSize.h));
                    }}
                    style={{flex:1,accentColor:"var(--accent)",height:3,cursor:"pointer",background:"transparent"}}
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                </div>
              </div>
              {/* Buttons */}
              <div style={{display:"flex",gap:10}}>
                <button
                  onClick={()=>{URL.revokeObjectURL(cropSrc);setCropSrc(null);cropPointersRef.current.clear();}}
                  style={{flex:1,padding:"13px",borderRadius:14,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",fontFamily:"'Lora',serif",fontSize:".88rem",fontWeight:500,cursor:"pointer"}}>
                  Batal
                </button>
                <button
                  onClick={confirmCrop}
                  style={{flex:2,padding:"13px",borderRadius:14,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".9rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 6px 20px rgba(196,149,106,.4)"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          entry={deleteTarget}
          onConfirm={() => doDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {/* Logout Modal */}
      {showLogout && (
        <LogoutModal
          onConfirm={() => signOut()}
          onCancel={() => setShowLogout(false)}
        />
      )}
      {showNotifPrompt && (
        <NotifPermissionModal
          onAllow={handleNotifAllow}
          onLater={handleNotifLater}
        />
      )}
      {pendingDelete && (
        <UnlockModal
          onUnlock={handleVerifyDelete}
          onClose={() => { setPendingDelete(null); setVerifyDeleteError(""); }}
          error={verifyDeleteError}
          setError={setVerifyDeleteError}
          lockType={pendingDelete?.lockType ?? "password"}
          title="Konfirmasi Penghapusan"
          description={pendingDelete?.lockType === "pin" ? "Catatan ini terkunci. Masukkan PIN untuk melanjutkan penghapusan." : "Catatan ini terkunci. Masukkan kata sandi untuk melanjutkan penghapusan."}
          actionLabel="Lanjutkan"
          accentColor="#B5705A"
        />
      )}
      {bulkVerifyDelete && (
        <UnlockModal
          onUnlock={async (password) => {
            setBulkVerifyError("");
            try {
              const res = await fetch("/api/auth/verify-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
              const data = await res.json();
              if (data.verified) { setBulkVerifyDelete(false); setBulkDeleteConfirm(true); }
              else setBulkVerifyError("Kata sandi salah.");
            } catch { setBulkVerifyError("Gagal memverifikasi."); }
          }}
          onClose={() => { setBulkVerifyDelete(false); setBulkVerifyError(""); }}
          error={bulkVerifyError}
          setError={setBulkVerifyError}
          title="Verifikasi Identitas"
          description="Beberapa catatan yang dipilih terkunci. Masukkan kata sandi untuk melanjutkan."
          actionLabel="Verifikasi"
          accentColor="#B5705A"
        />
      )}
      {bulkDeleteConfirm && (
        <DeleteManyModal
          count={selectedIds.size}
          hasLocked={Array.from(selectedIds).some(id => entries[id]?.isLocked)}
          onConfirm={() => { setBulkDeleteConfirm(false); doDeleteMany(Array.from(selectedIds)); }}
          onCancel={() => setBulkDeleteConfirm(false)}
        />
      )}

      {lightboxUrl && (
        <div onClick={()=>setLightboxUrl(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,cursor:"zoom-out"}}>
          <img src={lightboxUrl} alt="" style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:12,objectFit:"contain",boxShadow:"0 8px 60px rgba(0,0,0,.5)"}} onClick={e=>e.stopPropagation()}/>
          <button onClick={()=>setLightboxUrl(null)} style={{position:"absolute",top:16,right:16,width:36,height:36,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:"1.1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      )}
      <div className={`toast ${saved?"on":""}`}>✓ Tersimpan</div>
      <div className={`toast ${lockToast?"on":""}`}>🔒 Semua catatan terkunci</div>
      <div className={`toast ${pinLimitToast?"on":""}`}>📌 Maksimal 3 catatan di profil publik</div>
      <div className={`toast ${medalToast?"on":""}`} style={{color:"#B5902A", borderColor:"rgba(181,144,42,0.3)", background:"rgba(255,253,245,0.92)", fontWeight:600}}>
        <span style={{marginRight:8}}>🏅</span> Pencapaian: {medalToast}
      </div>
      <div className={`toast ${infoToast?"on":""}`}>{infoToast}</div>
      {showUnlock && pendingNav && (
        <UnlockModal
          onUnlock={(cred) => handleUnlock(cred)}
          onClose={() => {setShowUnlock(false); setPendingNav(null);}}
          error={unlockError} setError={setUnlockError}
          lockType={entriesRef.current[pendingNav.id]?.lockType ?? "password"}
        />
      )}
      {showLockModal && entry && (
        <LockNoteModal
          noteId={entry.id}
          hasPassword={hasPassword}
          csrf={csrfRef.current}
          accentColor={entry.color || undefined}
          onLocked={(lockType) => {
            setShowLockModal(false);
            upd("isLocked", true);
            // Also store lockType in local state
            const nextEntries = { ...entriesRef.current, [entry.id]: { ...entriesRef.current[entry.id], isLocked: true, lockType } };
            setEntries(nextEntries);
            lsFlush(nextEntries);
            // If Google-only user just set a password, update state
            if (lockType === "password" && !hasPassword) setHasPassword(true);
          }}
          onClose={() => setShowLockModal(false)}
        />
      )}
      {showShare && entry && (
        <ShareModal shareId={entry.shareId||null} isLocked={!!entry.isLocked} songTitle={entry.songTitle||""} shareMusic={entry.shareMusic!==false} onToggleMusic={()=>upd("shareMusic",entry.shareMusic===false?true:false)} onClose={()=>setShowShare(false)} onShare={handleShare} onRevoke={handleRevoke}/>
      )}
      {showDownloadModal && entry && (
        <DownloadModal onTxt={() => exportNote(entry)} onPdf={exportPDF} onCancel={() => setShowDownloadModal(false)} />
      )}

      {/* ── Mini Music Player ── */}
      {/* Hidden YouTube iframe (audio-only mode) */}
      {(view==="read"||view==="write") && isYouTubeSong && entry?.songId && (
        <iframe ref={ytIframeRef} src={`https://www.youtube.com/embed/${entry.songId.replace("yt_","")}?autoplay=1&loop=1&playlist=${entry.songId.replace("yt_","")}&enablejsapi=1`} allow="autoplay; encrypted-media" className="no-print" style={{position:"fixed",width:0,height:0,opacity:0,pointerEvents:"none",border:"none"}}/>
      )}
      {/* ── Mini Music Player ── */}
      {(view==="read"||view==="write") && entry?.songId && !focusMode && !openDropdown && !showMobStyle && !showMobActions && !showShare && !showDownloadModal && (
        view==="write" ? (
          <button className="no-print" style={{position:"fixed",bottom:24,right:24,zIndex:1200,width:40,height:40,borderRadius:"50%",border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,.18)",fontSize:".85rem"}}
            onClick={()=>{
              if(isYouTubeSong){const f=isPlaying?"pauseVideo":"playVideo";ytIframeRef.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func:f,args:[]}),"*");setIsPlaying(!isPlaying);}
              else{if(!audioRef.current)return;if(isPlaying){audioRef.current.pause();setIsPlaying(false);}else{audioRef.current.play().then(()=>setIsPlaying(true)).catch(()=>{});}}
            }}>
            {isPlaying?"⏸":"▶"}
          </button>
        ) : (
          <div className="no-print" style={{position:"fixed",bottom:24,right:24,zIndex:1200,display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:16,background:"var(--surface,#fff)",boxShadow:"0 4px 24px rgba(0,0,0,.13)",border:"1px solid var(--line)",maxWidth:"min(260px, calc(100vw - 48px))",backdropFilter:"blur(8px)"}}>
            {entry.songArtwork && <img src={entry.songArtwork} alt="" style={{width:38,height:38,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
            <div style={{overflow:"hidden",flex:1,minWidth:0}}>
              <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink)",fontWeight:600,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.songTitle||""}</p>
              <p style={{fontFamily:"'Lora',serif",fontSize:".62rem",color:"var(--ink3)",margin:0}}>{isYouTubeSong?"YouTube · berulang":"30 detik · berulang"}</p>
            </div>
            <button onClick={()=>{
              if(isYouTubeSong){const f=isPlaying?"pauseVideo":"playVideo";ytIframeRef.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func:f,args:[]}),"*");setIsPlaying(!isPlaying);}
              else{if(!audioRef.current)return;if(isPlaying){audioRef.current.pause();setIsPlaying(false);}else{audioRef.current.play().then(()=>setIsPlaying(true)).catch(()=>{});}}
            }} style={{width:30,height:30,borderRadius:"50%",border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:".8rem"}}>
              {isPlaying?"⏸":"▶"}
            </button>
          </div>
        )
      )}

      {/* ── Desktop sticky header ── */}
      <header className="desk-header">
        <div className="desk-header-inner">
          {/* Brand */}
          <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0,cursor:"default"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",flexShrink:0}}/>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:300,color:"var(--ink)",letterSpacing:"-.01em"}}>Catatanku</span>
          </div>
          {/* Center nav */}
          <div style={{display:"flex",gap:2,alignItems:"center"}}>
            <button className={`desk-tab ${view==="home"?"act":""}`} onClick={()=>nav("home")}><Ic d={IC.home} size={14} sw={1.4}/>Beranda</button>
            <button className={`desk-tab ${view==="list"?"act":""}`} onClick={()=>nav("list")}><Ic d={IC.search} size={14} sw={1.4}/>Daftar</button>
            <button className={`desk-tab ${view==="calendar"||view==="dayview"?"act":""}`} onClick={()=>nav("calendar")}><Ic d={IC.cal} size={14} sw={1.4}/>Kalender</button>
            <button className={`desk-tab ${view==="map"?"act":""}`} onMouseEnter={preloadLeaflet} onClick={()=>nav("map")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline"}}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>Peta</button>
            <button className={`desk-tab ${view==="settings"?"act":""}`} onClick={()=>{nav("settings");loadProfile();}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline"}}><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>Profil</button>
          </div>
          {/* Right: context dropdown + edit button + sign out */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {(view==="write"||view==="read") && entry && (<>
              {view==="read" && (
                <button className="gb" onClick={()=>nav("write",selId)} style={{padding:"6px 14px",borderRadius:9,background:"var(--accent)",color:"#fff",fontSize:".8rem",gap:6,fontFamily:"'Lora',serif",border:"none"}}>
                  <Ic d={IC.edit} size={13} color="#fff"/>Edit
                </button>
              )}
              {/* Dropdown */}
              <div className="ddrop">
                {showDeskMenu && <div style={{position:"fixed",inset:0,zIndex:299}} onClick={()=>setShowDeskMenu(false)}/>}
                <button className="ddrop-btn" onClick={()=>setShowDeskMenu(v=>!v)}>
                  <Ic d={IC.dots} size={15} sw={2}/>Lainnya
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3.5l3 3 3-3"/></svg>
                </button>
                {showDeskMenu && (
                  <div className="ddrop-menu">
                    <button className={`ddrop-item ${entry.isPinned?"active":""}`} onClick={()=>{upd("isPinned",!entry.isPinned);setShowDeskMenu(false);}}>
                      <Ic d={IC.pin} size={16} sw={entry.isPinned?2.2:1.6} color={entry.isPinned?"var(--accent)":"var(--ink2)"}/>
                      {entry.isPinned?"Lepas Pin":"Pin Catatan"}
                    </button>
                    <button className={`ddrop-item ${entry.isProfilePinned?"active":""}`} onClick={()=>{
                      if (!entry.isProfilePinned) {
                        const profCount = Object.values(entries).filter((e:any) => e.isProfilePinned).length;
                        if (profCount >= 3) { setPinLimitToast(true); setTimeout(() => setPinLimitToast(false), 2500); return; }
                      }
                      upd("isProfilePinned",!entry.isProfilePinned);setShowDeskMenu(false);
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={entry.isProfilePinned?"var(--accent)":"var(--ink2)"} strokeWidth={entry.isProfilePinned?2.2:1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {entry.isProfilePinned?"Lepas dari Profil":"Pin ke Profil"}
                    </button>
                    <button className={`ddrop-item ${entry.isLocked?"active":""}`} onClick={()=>{
                      setShowDeskMenu(false);
                      if (entry.isLocked) {
                        // Remove lock (note is already unlocked in session)
                        fetch("/api/notes/lock", { method:"DELETE", headers:{"Content-Type":"application/json","X-CSRF-Token":csrfRef.current}, body: JSON.stringify({noteId: entry.id}) }).catch(()=>{});
                        upd("isLocked", false);
                      } else {
                        setShowLockModal(true);
                      }
                    }}>
                      <Ic d={entry.isLocked?IC.lock:IC.unlock} size={16} sw={1.6} color={entry.isLocked?"var(--accent)":"var(--ink2)"}/>
                      {entry.isLocked?"Lepas Kunci":"Kunci Catatan"}
                    </button>
                    <button className={`ddrop-item ${entry.shareId&&!entry.isModerated?"active":""}`} onClick={()=>{setShowDeskMenu(false);if(!entry.isLocked&&!entry.isModerated)setShowShare(true);}} style={{opacity:(entry.isLocked||entry.isModerated)?.45:1,cursor:(entry.isLocked||entry.isModerated)?"not-allowed":"pointer"}}>
                      <Ic d={IC.share} size={16} sw={1.6} color={entry.shareId&&!entry.isModerated?"var(--accent)":"var(--ink2)"}/>
                      Bagikan{entry.isLocked?" (Terkunci)":entry.isModerated?" (Dibatasi Admin)":""}
                    </button>
                    <button className="ddrop-item" onClick={()=>{setShowDownloadModal(true);setShowDeskMenu(false);}}>
                      <Ic d={IC.download} size={16} sw={1.6} color="var(--ink2)"/>Unduh
                    </button>
                    <button className="ddrop-item" onClick={()=>{if(!entry.isLocked){setShowDeskMenu(false);duplicateNote(entry);}}} style={{opacity:entry.isLocked?.45:1,cursor:entry.isLocked?"not-allowed":"pointer"}}>
                      <Ic d={IC.copy} size={16} sw={1.6} color="var(--ink2)"/>Duplikat{entry.isLocked?" (Terkunci)":""}
                    </button>
                    <button className="ddrop-item" onClick={()=>{setShowDeskMenu(false);setFocusModeWrapper(true);}}>
                      <Ic d={IC.focus} size={16} sw={1.5} color="var(--ink2)"/>Mode Fokus
                    </button>
                    <div className="ddrop-sep"/>
                    <button className="ddrop-item danger" onClick={()=>{setShowDeskMenu(false);requestDelete(entry);}}>
                      <Ic d={IC.trash} size={16} sw={1.6} color="#B5705A"/>Hapus Catatan
                    </button>
                  </div>
                )}
              </div>
              <div className="desk-hdr-sep"/>
            </>)}
            <button className="gb" onClick={()=>setShowLogout(true)} style={{fontSize:".8rem",gap:5,padding:"4px 8px"}}><Ic d={IC.x} size={13} sw={1.8}/>Logout</button>
            <div style={{width:30,height:30,borderRadius:"50%",background:"var(--accent-soft)",border:"1.5px solid var(--line)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}} onClick={()=>nav("settings")} title="Profil">
              {profileImage ? <img src={profileImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",color:"var(--accent)",fontWeight:300,lineHeight:1}}>{(session?.user?.name||session?.user?.email||"?")[0]?.toUpperCase()}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className={`shell ${anim}${view==="settings"?" st-shell-mob":""}`}>

        {/* ════════ HOME ════════ */}
        {view==="home" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
            <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",letterSpacing:".05em"}}>{fullD(todayStr)}</p>
            <button className="mob-only gb" onClick={()=>nav("settings")} style={{fontSize:".8rem",gap:5}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
              {session?.user?.name?.split(" ")[0] || "Profil"}
            </button>
          </div>

          <div className="home-hero s2">
            <div className="home-hero-left">
              <div style={{display:"flex",gap:16,alignItems:"stretch",marginBottom:16}}>
                <div style={{width:2,borderRadius:1,background:"linear-gradient(180deg,var(--accent),var(--accent-soft),transparent)",flexShrink:0}}/>
                <div>
                  <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(2.4rem,4vw,3.4rem)",fontWeight:300,lineHeight:1.1,color:"var(--ink)",marginBottom:8}}>{greet}</h1>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink2)",lineHeight:1.7}}>
                    {total===0?"Mulailah menulis ceritamu hari ini.":`${total} catatan telah kamu simpan.`}
                  </p>
                  {streakLoaded && streak && (() => {
                    const m = getMilestone(streak.currentStreak);
                    const isAct = streak.status==="active";
                    const isRisk = streak.status==="at_risk";
                    const isBrk = streak.status==="broken";
                    return (
                      <div style={{position:"relative",display:"inline-block",marginTop:10}}>
                        {showMilestoneBurst && <MilestoneBurst/>}
                        <div style={{
                          display:"inline-flex",alignItems:"center",gap:6,
                          padding:"4px 10px 4px 6px",borderRadius:24,
                          background:isBrk?"transparent":isRisk?"#FFFDF5":"rgba(196,149,106,.08)",
                          border:`1px solid ${isBrk?"var(--line)":isRisk?"#F0D090":"var(--accent-soft)"}`,
                          animation:isRisk?"streakAtRisk 2.2s ease-in-out infinite":undefined,
                          transition:"all .4s ease",
                        }}>
                          <FlameSVG status={streak.status} size={16} streak={streak.currentStreak}/>
                          <span style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isBrk?"var(--ink3)":isRisk?"#D4853C":"var(--accent)",lineHeight:1}}>
                            {isBrk&&streak.currentStreak===0?"mulai streak hari ini":`${displayedStreak} hari berturut-turut`}
                          </span>
                          {isRisk&&<span style={{fontSize:".7rem",lineHeight:1}}>⚡</span>}
                          {m&&!isBrk&&<span style={{fontSize:".7rem",lineHeight:1}}>{m.badge}</span>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {total>0 && (
                  <div className="home-stats">
                    <div className="stat-item">
                      <span className="stat-val">{total}</span>
                      <span className="stat-lbl">catatan total</span>
                    </div>
                    <div style={{width:1,height:36,background:"var(--line)",alignSelf:"center"}}/>
                    <div className="stat-item">
                      <span className="stat-val">{homeStats.thisMonthCount}</span>
                      <span className="stat-lbl">bulan ini</span>
                    </div>
                    {homeStats.topMood && <><div style={{width:1,height:36,background:"var(--line)",alignSelf:"center"}}/>
                    <div className="stat-item">
                      <span className="stat-val" style={{fontSize:"1.5rem"}}>{homeStats.topMood.emoji}</span>
                      <span className="stat-lbl">suasana dominan</span>
                    </div></>}
                  </div>
              )}
            </div>

            <div className="home-hero-right">
              {todayEntries.length===0 ? (
                <div className="ecard" onClick={()=>newEntry(todayStr)} style={{"--card-accent":"var(--accent)","--card-border":"var(--accent-soft)",background:isDarkApp?"var(--surface)":"linear-gradient(135deg,#FFFCF7,#FFF5EA)",padding:"22px 24px"} as any}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--accent)",letterSpacing:".12em",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Tulis Hari Ini</p>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:300,fontStyle:"italic",color:"var(--ink)",lineHeight:1.5,marginBottom:16}}>{getPrompt(todayStr)}</p>
                  <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--accent)",fontFamily:"'Lora',serif",fontSize:".8rem"}}>Mulai menulis <Ic d={IC.arrow} size={13} sw={2}/></div>
                </div>
              ) : (
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--accent)",letterSpacing:".1em",textTransform:"uppercase",fontWeight:600}}>Hari Ini</span>
                      <span className="today-count">{todayEntries.length}</span>
                    </div>
                    <button className="gb" onClick={()=>newEntry(todayStr)} style={{fontSize:".8rem",color:"var(--accent)"}}><Ic d={IC.plus} size={14} sw={2}/> Tulis lagi</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {todayEntries.map((e: any) => {
                      const m=entryMood(e);
                      const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
                      const isLocked = e.isLocked && !unlockedIds.includes(e.id);
                      return (
                        <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent)","--card-border":eTheme?.accent||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.border:null)||m?.border||"var(--accent-soft)",background:(isDarkApp&&!(eTheme as any)?.dark)?"var(--surface)":eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",padding:"16px 20px",position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:isDarkApp?{}:(eTheme||e.color||m)?{"--ink":"#000000","--ink2":"#111111","--ink3":"#333333"}:{})} as any}>
                           {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                           {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={20} color="var(--accent)"/></div>}
                           {e.isPinned && !isLocked && <div style={{position:"absolute",top:10,right:10,zIndex:3,color:"var(--accent)",opacity:.7}}><Ic d={IC.pin} size={12} sw={2}/></div>}
                           <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                             <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                               <div style={{display:"flex",alignItems:"center",gap:6}}>
                                 <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{timeStr(e.ts)}</span>
                                 {e.stickers?.length>0 && <span style={{fontSize:".7rem",opacity:.7}}>{e.stickers.slice(0,3).join("")}</span>}
                               </div>
                               <div style={{display:"flex",alignItems:"center",gap:5}}>
                                 {e.isModerated && (
                                   <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 6px",borderRadius:6,background:"#FFF0F0",color:"#B85050",fontWeight:600,border:"1px solid #FFCDCD",display:"inline-flex",alignItems:"center",gap:3}}>
                                     🛡️ Dibatasi Admin
                                   </span>
                                 )}
                                 {!e.isModerated && e.isImported && (
                                   <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 6px",borderRadius:6,background:isDarkApp?"rgba(255,255,255,.08)":"rgba(0,0,0,.04)",color:"var(--ink3)",fontWeight:500,border:"1px solid var(--line)",display:"inline-flex",alignItems:"center",gap:3}}>
                                     <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                     Diimpor
                                   </span>
                                 )}
                                 {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",padding:"1px 6px",borderRadius:6,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                                 {m && <span style={{fontSize:".88rem"}}>{m.emoji}</span>}
                               </div>
                             </div>
                             {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.08rem",fontWeight:500,color:"var(--ink)",marginBottom:3}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                             {isLocked
                               ? <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>{makeDummy(Math.min(e.textWords||12,20),e.id+'x')}</p>
                               : (()=>{
                                   const lines=(e.text||'').split('\n').filter((l:string)=>/^--x?\s|^--x?$/.test(l));
                                   if(lines.length>0){const done=lines.filter((l:string)=>l.startsWith('--x')).length;return(<div>{lines.slice(0,3).map((l:string,i:number)=>{const isDone=l.startsWith('--x');return(<p key={i} style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:isDone?"var(--ink3)":"var(--ink2)",lineHeight:1.5,display:"flex",alignItems:"center",gap:5,textDecoration:isDone?"line-through":"none"}}><span style={{fontSize:".5rem",color:"var(--accent)",flexShrink:0}}>●</span>{l.replace(/^--x?\s?/,'')}</p>)})}<p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",marginTop:3}}>{done}/{lines.length} selesai</p></div>);}
                                   const ogImg = getLinkImage(e.text||'');
                                   const hasLinkB=(e.text||'').includes('[LINK:');
                                   const lColor=eTheme?.accent||"#C4952A";
                                   return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:hasLinkB?lColor:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,flex:1}}>{getPreviewText(e.text||'')}</p>{ogImg&&<img src={ogImg} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>;
                                 })()
                             }
                           </div>
                         </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {nonTodayNotes.length>0 && (
            <div className="s3">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:18}}>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:500,color:"var(--ink)"}}>Catatan Sebelumnya</h2>
                {allSorted.length>10 && <button className="gb" onClick={()=>nav("list")} style={{fontSize:".8rem"}}>Lihat semua <Ic d={IC.chevR} size={11} sw={2}/></button>}
              </div>
              <div className="home-grid">
                {nonTodayNotes.slice(0,9).map((e: any,i: number) => {
                  const m=entryMood(e); const isLong=(e.text||"").length>120;
                  const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
                  const sameDay=(byDate[e.date]||[]).length;
                  const isLocked = e.isLocked && !unlockedIds.includes(e.id);
                  return (
                    <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.border:null)||m?.border||"var(--line)",background:(isDarkApp&&!(eTheme as any)?.dark)?"var(--surface)":eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",animation:`fadeUp .45s ease ${.18+i*.05}s both`,position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:isDarkApp?{}:(eTheme||e.color||m)?{"--ink":"#000000","--ink2":"#111111","--ink3":"#333333"}:{})} as any}>
                       {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                       {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={18} color="var(--accent)"/></div>}
                       {e.isPinned && !isLocked && <div style={{position:"absolute",top:10,right:10,zIndex:3,color:"var(--accent)",opacity:.7}}><Ic d={IC.pin} size={12} sw={2}/></div>}
                       <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                         <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isLong?10:6}}>
                           <div style={{display:"flex",alignItems:"center",gap:6}}>
                             <span style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:eTheme?.accent||m?.color||"var(--ink2)"}}>{shortD(e.date)}</span>
                             {sameDay>1 && <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:"var(--ink2)",background:"var(--surface2)",borderRadius:8,padding:"1px 6px"}}>{timeStr(e.ts)}</span>}
                           </div>
                           <div style={{display:"flex",alignItems:"center",gap:6}}>
                             {e.isModerated && (
                               <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 5px",borderRadius:5,background:"#FFF0F0",color:"#B85050",fontWeight:600,border:"1px solid #FFCDCD",display:"inline-flex",alignItems:"center",gap:3}}>
                                 🛡️ Dibatasi Admin
                               </span>
                             )}
                             {!e.isModerated && e.isImported && (
                               <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 5px",borderRadius:5,background:isDarkApp?"rgba(255,255,255,.08)":"rgba(0,0,0,.04)",color:"var(--ink3)",fontWeight:500,border:"1px solid var(--line)",display:"inline-flex",alignItems:"center",gap:3}} title="Catatan ini hasil impor">
                                 <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                 Diimpor
                               </span>
                             )}
                             {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 5px",borderRadius:5,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                             {e.stickers?.length>0 && <span style={{fontSize:".65rem",opacity:.6}}>{e.stickers.slice(0,2).join("")}</span>}
                             {m && <span style={{fontSize:".85rem"}}>{m.emoji}</span>}
                             <button className="gb del-icon" onClick={ev=>{ev.stopPropagation();requestDelete(e)}}><Ic d={IC.trash} size={13}/></button>
                           </div>
                         </div>
                         {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isLong?"1.06rem":"1rem",fontWeight:500,color:"var(--ink)",marginBottom:4,lineHeight:1.3}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                         {isLocked
                           ? <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:isLong?4:2,WebkitBoxOrient:"vertical" as const}}>{makeDummy(Math.min(e.textWords||12,30),e.id+'x')}</p>
                           : (()=>{
                               const lines=(e.text||'').split('\n').filter((l:string)=>/^--x?\s|^--x?$/.test(l));
                               if(lines.length>0){const done=lines.filter((l:string)=>l.startsWith('--x')).length;return(<div>{lines.slice(0,3).map((l:string,i:number)=>{const isDone=l.startsWith('--x');return(<p key={i} style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:isDone?"var(--ink3)":"var(--ink2)",lineHeight:1.5,display:"flex",alignItems:"center",gap:5,textDecoration:isDone?"line-through":"none"}}><span style={{fontSize:".5rem",color:"var(--accent)",flexShrink:0}}>●</span>{l.replace(/^--x?\s?/,'')}</p>)})}<p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",marginTop:3}}>{done}/{lines.length} selesai</p></div>);}
                               const ogImg2=getLinkImage(e.text||'');
                               const hasLinkC=(e.text||'').includes('[LINK:');
                               const lColorC=eTheme?.accent||"#C4952A";
                               return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:hasLinkC?lColorC:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:isLong?4:2,WebkitBoxOrient:"vertical" as const,flex:1}}>{getPreviewText(e.text||'')}</p>{ogImg2&&<img src={ogImg2} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>;
                             })()
                         }
                       </div>
                     </div>
                  );
                })}
              </div>
            </div>
          )}

          {total===0 && (
            <div className="s4" style={{padding:"56px 0",maxWidth:400}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"4.5rem",lineHeight:1,color:"var(--accent-soft)",marginBottom:-12,userSelect:"none"}}>"</div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontStyle:"italic",color:"var(--ink3)",lineHeight:1.7}}>Menulis adalah cara terindah<br/>untuk berbicara dengan diri sendiri.</p>
            </div>
          )}
        </div>)}

        {/* ════════ WRITE ════════ */}
        {view==="write" && entry && (<div>
          {focusMode ? (
            <>
              <button className="focus-exit-btn" onClick={()=>setFocusMode(false)}>
                <Ic d={IC.minimize} size={14} sw={1.6}/>Keluar Fokus
              </button>
              <div className="focus-wc">{calcReadingTime(entry.text)} mnt baca · {(entry.text||"").trim().split(/\s+/).filter(Boolean).length} kata</div>
            </>
          ) : (
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,animation:"pgIn .3s cubic-bezier(.23,1,.32,1) both"}}>
            <button className="gb" onClick={()=>entry.text?.trim()?nav("read",selId):nav("home")}><Ic d={IC.back} size={17}/>Kembali</button>
            <button className="mob-only gb" onClick={()=>setShowMobActions(true)} style={{padding:"6px 8px"}}><Ic d={IC.dots} size={22} sw={2.5}/></button>
          </div>
          )}

          {/* ── Write Toolbar (desktop only) ── */}
          {(() => {
            const wc = (entry.text||"").trim().split(/\s+/).filter(Boolean).length;
            const curMood = entry.mood!=null ? MOODS[entry.mood] : null;
            const curColor = entry.color ? NOTE_COLORS.find((c:any)=>c.id===entry.color) : null;
            const curTheme = entry.theme ? NOTE_THEMES.find((t:any)=>t.id===entry.theme) : null;
            const curFont = entry.font ? NOTE_FONTS.find((f:any)=>f.id===entry.font) : null;
            const chevron = <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3.5l3 3 3-3"/></svg>;
            const close = ()=>setOpenDropdown(null);
            const openDrop = (e: React.MouseEvent<HTMLButtonElement>, key: string) => {
              if (openDropdown===key) { close(); return; }
              const r = e.currentTarget.getBoundingClientRect();
              setDropPos({top: r.bottom+6, left: r.left, right: r.right});
              setOpenDropdown(key);
            };
            return (
              <div className="write-toolbar">
                {openDropdown && <div style={{position:"fixed",inset:0,zIndex:499}} onClick={close}/>}
                {/* Date */}
                <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",flexShrink:0,padding:"0 8px 0 4px"}}>
                  {DAYS_SHORT[new Date(entry.date+"T00:00:00").getDay()]}, {new Date(entry.date+"T00:00:00").getDate()} {MONTHS[new Date(entry.date+"T00:00:00").getMonth()]}
                </span>
                <div style={{width:1,height:14,background:"var(--line)",flexShrink:0,margin:"0 4px"}}/>
                {/* Mood */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curMood?" wact":""}`} onClick={e=>openDrop(e,"mood")}>
                    <span style={{fontSize:".95rem"}}>{curMood?curMood.emoji:"😊"}</span>{curMood?curMood.label:"Perasaan"}{chevron}
                  </button>
                  {openDropdown==="mood" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:170}}>
                      <span className="wdrop-label">Perasaan</span>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {MOODS.map((m,i)=>(
                          <button key={i} className="mood-chip" onClick={()=>{upd("mood",entry.mood===i?null:i);close();}} style={{border:entry.mood===i?`1.5px solid ${m.color}`:"1px solid transparent",background:entry.mood===i?m.bg:"transparent",color:entry.mood===i?m.color:"var(--ink2)",justifyContent:"flex-start",fontWeight:entry.mood===i?500:400}}>
                            <span style={{fontSize:".95rem"}}>{m.emoji}</span>{m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Color */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curColor?" wact":""}`} onClick={e=>openDrop(e,"color")}>
                    {curColor
                      ? <span style={{width:12,height:12,borderRadius:"50%",background:curColor.bg,border:"1.5px solid var(--accent-soft)",display:"inline-block",flexShrink:0}}/>
                      : <span style={{fontSize:".85rem"}}>🎨</span>}
                    Warna{chevron}
                  </button>
                  {openDropdown==="color" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:180}}>
                      <span className="wdrop-label">Warna</span>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"2px 2px 4px"}}>
                        {NOTE_COLORS.map((c:any)=>(
                          <button key={c.id} title={c.label} onClick={()=>{upd("color",c.id===entry.color?"":c.id);close();}} style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${entry.color===c.id?(c.accent||"var(--accent)"):"transparent"}`,background:c.bg||"#FAF6F0",cursor:"pointer",boxShadow:`0 0 0 1px ${entry.color===c.id?"var(--line)":"transparent"}`,transition:"all .15s"}}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Theme */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curTheme?" wact":""}`} onClick={e=>openDrop(e,"theme")}>
                    <span style={{fontSize:".85rem"}}>{curTheme?curTheme.emoji:"🌿"}</span>{curTheme?curTheme.label:"Tema"}{chevron}
                  </button>
                  {openDropdown==="theme" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:220}}>
                      <span className="wdrop-label">Tema Halaman</span>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {NOTE_THEMES.filter((t:any)=>!(t.seasonal==='ramadan'&&!isRamadan)||(entry.theme===t.id)).map((t:any)=>{
                          const isAct=entry.theme===t.id;
                          return (
                            <button key={t.id} onClick={()=>{upd("theme",isAct?"":t.id);close();}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:9,border:`1.5px solid ${isAct?t.accent:"transparent"}`,background:isAct?t.bg:"transparent",cursor:"pointer",transition:"all .12s",textAlign:"left" as const}}>
                              <span style={{fontSize:".9rem"}}>{t.emoji}</span>
                              <div>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isAct?t.accent:"var(--ink2)",fontWeight:isAct?600:400,lineHeight:1.2}}>
                                  {t.label}{t.seasonal==='ramadan'&&<span style={{marginLeft:5,fontSize:".6rem",background:`${t.accent}22`,color:t.accent,padding:"1px 5px",borderRadius:4,fontWeight:500}}>Ramadan</span>}
                                </p>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",lineHeight:1.2}}>{t.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* Font */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curFont?" wact":""}`} onClick={e=>openDrop(e,"font")}>
                    <span style={{fontFamily:curFont?.family||"inherit",fontSize:".9rem",fontWeight:500}}>Aa</span>{curFont?curFont.label:"Font"}{chevron}
                  </button>
                  {openDropdown==="font" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:210}}>
                      <span className="wdrop-label">Font</span>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {NOTE_FONTS.map((f:any)=>{
                          const isAct=(entry.font||"")===f.id;
                          return (
                            <button key={f.id} onClick={()=>{upd("font",f.id);close();}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 9px",borderRadius:9,border:`1.5px solid ${isAct?"var(--accent)":"transparent"}`,background:isAct?"var(--accent-soft)":"transparent",cursor:"pointer",transition:"all .12s",textAlign:"left" as const}}>
                              <span style={{fontFamily:f.family,fontSize:"1.1rem",fontWeight:500,color:isAct?"var(--accent)":"var(--ink)",width:26,textAlign:"center" as const,flexShrink:0}}>{f.sample}</span>
                              <div>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isAct?"var(--accent)":"var(--ink2)",fontWeight:isAct?600:400,lineHeight:1.2}}>{f.label}</p>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",lineHeight:1.2}}>{f.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* Music */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${entry.songId?" wact":""}`} onClick={e=>{setSongSearch("");setSongResults([]);openDrop(e,"music");}}>
                    <span style={{fontSize:".85rem"}}>🎵</span>{entry.songId?<span style={{maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"inline-block",verticalAlign:"middle"}}>{entry.songTitle||"Lagu"}</span>:"Musik"}{entry.songId?null:chevron}
                    {entry.songId && <span onClick={e=>{e.stopPropagation();updMany({songId:"",songTitle:"",songArtwork:"",songPreview:""});}} style={{marginLeft:4,opacity:.5,fontSize:".7rem",cursor:"pointer"}}>✕</span>}
                  </button>
                  {openDropdown==="music" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:280}}>
                      <span className="wdrop-label">Pilih Musik</span>
                      <input
                        autoFocus
                        placeholder="Cari lagu..."
                        value={songSearch}
                        onChange={e=>{
                          const v=e.target.value; setSongSearch(v);
                          if(songSearchTimer.current) clearTimeout(songSearchTimer.current);
                          if(!v.trim()){setSongResults([]);return;}
                          setSongSearching(true);
                          songSearchTimer.current=setTimeout(async()=>{
                            try{const r=await fetch(`/api/music/search?q=${encodeURIComponent(v)}`);const d=await r.json();setSongResults(d);}catch{}
                            setSongSearching(false);
                          },400);
                        }}
                        style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".8rem",outline:"none",boxSizing:"border-box" as const,marginBottom:8}}
                      />
                      {songSearching && <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--ink3)",textAlign:"center" as const,padding:"8px 0"}}>Mencari...</p>}
                      {!songSearching && songResults.length===0 && songSearch.trim() && <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--ink3)",textAlign:"center" as const,padding:"8px 0"}}>Tidak ada hasil</p>}
                      <div style={{display:"flex",flexDirection:"column" as const,gap:2,maxHeight:220,overflowY:"auto" as const}}>
                        {songResults.map((s:any)=>(
                          <button key={s.id} onClick={()=>{updMany({songId:s.id,songTitle:`${s.title} - ${s.artist}`,songArtwork:s.artwork,songPreview:s.previewUrl});close();}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",borderRadius:9,border:`1.5px solid ${entry.songId===s.id?"var(--accent)":"transparent"}`,background:entry.songId===s.id?"var(--accent-soft)":"transparent",cursor:"pointer",textAlign:"left" as const}}>
                            {s.artwork && <img src={s.artwork} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover" as const,flexShrink:0}}/>}
                            <div style={{overflow:"hidden"}}>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:entry.songId===s.id?"var(--accent)":"var(--ink)",fontWeight:500,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</p>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",lineHeight:1.2}}>{s.artist}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div style={{borderTop:"1px solid var(--line)",marginTop:8,paddingTop:8}}>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",marginBottom:5}}>▶ Atau paste link YouTube</p>
                        <div style={{display:"flex",gap:6}}>
                          <input value={ytUrl} onChange={e=>{setYtUrl(e.target.value);setYtError("");setYtPreview(null);}} placeholder="https://youtube.com/watch?v=..." onKeyDown={e=>{if(e.key==="Enter"&&ytUrl.trim())addYouTubeSong(ytUrl.trim());}} style={{flex:1,padding:"6px 8px",borderRadius:7,border:"1px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".75rem",outline:"none"}}/>
                          <button onClick={()=>{if(ytUrl.trim())addYouTubeSong(ytUrl.trim());}} disabled={ytLoading||!ytUrl.trim()} style={{padding:"6px 10px",borderRadius:7,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".72rem",cursor:"pointer",opacity:ytLoading||!ytUrl.trim()?0.5:1}}>{ytLoading?"...":"Cek"}</button>
                        </div>
                        {ytError && <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"#c0392b",marginTop:4}}>{ytError}</p>}
                        {ytPreview && (
                          <button onClick={()=>confirmYtSong(ytPreview,close)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",marginTop:6,padding:"7px 8px",borderRadius:9,border:"1.5px solid var(--accent)",background:"var(--accent-soft)",cursor:"pointer",textAlign:"left" as const}}>
                            <img src={ytPreview.thumbnail} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover" as const,flexShrink:0}}/>
                            <div style={{overflow:"hidden",flex:1,minWidth:0}}>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--accent)",fontWeight:600,lineHeight:1.2,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ytPreview.title}</p>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",lineHeight:1.2,margin:0}}>{ytPreview.author} · Tap untuk pilih</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Tags */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${(entry.tags||[]).length>0?" wact":""}`} onClick={e=>openDrop(e,"tags")}>
                    <span style={{fontSize:".85rem"}}>🏷️</span>
                    {(entry.tags||[]).length>0?`${(entry.tags||[]).length} label`:"Label"}{chevron}
                  </button>
                  {openDropdown==="tags" && (
                    <div className="wdrop" style={{top:dropPos.top,left:Math.max(8,dropPos.right-244),minWidth:240}}>
                      <span className="wdrop-label">Label</span>
                      {(entry.tags||[]).length>0 && (
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                          {(entry.tags||[]).map((t:string)=>(
                            <span key={t} className="tag-chip" onClick={()=>removeTag(t)}>#{t} ×</span>
                          ))}
                        </div>
                      )}
                      <input className="tag-input" placeholder="+ tambah label, Enter" value={tagInput}
                        onChange={(e:any)=>setTagInput(e.target.value)}
                        onKeyDown={(e:any)=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addTag(tagInput);setTagInput("");}}}
                        style={{marginBottom:4}}
                        autoFocus
                      />
                      {tagInput.trim() && allTags.filter(({tag}:any)=>tag.includes(tagInput.replace(/^#+/,"").toLowerCase())&&!(entry.tags||[]).includes(tag)).slice(0,4).map(({tag}:any)=>(
                        <div key={tag} style={{padding:"4px 8px",cursor:"pointer",fontSize:".76rem",fontFamily:"'Lora',serif",color:"var(--ink2)",borderRadius:6,transition:"background .1s"}} onClick={()=>{addTag(tag);setTagInput("");}}
                          onMouseEnter={(e:any)=>e.currentTarget.style.background="var(--bg)"}
                          onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}>#{tag}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{flex:1}}/>
                {/* Right: word count + font size + sticker + done */}
                <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",padding:"0 6px",flexShrink:0}}>{calcReadingTime(entry.text)} mnt baca · {wc} kata</span>
                <div style={{width:1,height:14,background:"var(--line)",flexShrink:0,margin:"0 2px"}}/>
                <button className="wtbtn" onClick={()=>changeFontSize(-1)} disabled={fontSize===0} style={{fontSize:".72rem",padding:"4px 8px",opacity:fontSize===0?.35:1}}>A−</button>
                <button className="wtbtn" onClick={()=>changeFontSize(1)} disabled={fontSize===2} style={{fontSize:".82rem",padding:"4px 8px",opacity:fontSize===2?.35:1}}>A+</button>
                <button className={`wtbtn${showStickers?" wact":""}`} onClick={()=>setShowStickers(!showStickers)} style={{gap:4}}>
                  <Ic d={IC.sticker} size={14} sw={1.4}/>Stiker{entry.stickers?.length?` (${entry.stickers.length})`:""}
                </button>
                <button className="wtbtn" onClick={()=>setFocusMode(true)} style={{gap:4}} title="Mode Fokus (Esc untuk keluar)">
                  <Ic d={IC.focus} size={14} sw={1.5}/>Fokus
                </button>
                {entry.text?.trim() && (
                  <button className="wtbtn wact" onClick={()=>nav("read",selId)} style={{fontWeight:500,marginLeft:4}}>
                    Selesai ✓
                  </button>
                )}
              </div>
            );
          })()}

          <div className="write-layout">
            <div className="write-sidebar s2">
              <div style={{marginBottom:28}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"3rem",fontWeight:300,color:"var(--ink)",lineHeight:1}}>{new Date(entry.date+"T00:00:00").getDate()}</p>
                <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",marginTop:4}}>{MONTHS[new Date(entry.date+"T00:00:00").getMonth()]} {new Date(entry.date+"T00:00:00").getFullYear()}</p>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink3)",marginTop:2}}>{DAYS_SHORT[new Date(entry.date+"T00:00:00").getDay()]}{timeStr(entry.ts) && ` · ${timeStr(entry.ts)}`}</p>
              </div>
              <div style={{marginBottom:20}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Warna</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {NOTE_COLORS.map(c=>(
                    <button key={c.id} title={c.label} onClick={()=>upd("color",c.id)} style={{width:26,height:26,borderRadius:"50%",border:`2.5px solid ${entry.color===c.id?(c.accent||"var(--accent)"):"transparent"}`,background:c.bg||"#FAF6F0",cursor:"pointer",boxShadow:`0 0 0 1px ${entry.color===c.id?"var(--line)":"transparent"}`,transition:"all .15s"}}/>
                  ))}
                </div>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginTop:14,marginBottom:8,letterSpacing:".04em"}}>Tema</p>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {NOTE_THEMES.filter((t:any)=>!(t.seasonal==='ramadan'&&!isRamadan)||(entry.theme===t.id)).map(t=>{
                    const isActive = entry.theme===t.id;
                    return (
                      <button key={t.id} onClick={()=>upd("theme", isActive ? '' : t.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:9,border:`1.5px solid ${isActive?t.accent:"var(--line)"}`,background:isActive?t.bg:"transparent",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                        <span style={{fontSize:".95rem"}}>{t.emoji}</span>
                        <div>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isActive?t.accent:"var(--ink2)",fontWeight:isActive?600:400,lineHeight:1.2}}>
                            {t.label}{(t as any).seasonal==='ramadan'&&<span style={{marginLeft:5,fontSize:".58rem",background:`${t.accent}22`,color:t.accent,padding:"1px 4px",borderRadius:3,fontWeight:500}}>Ramadan</span>}
                          </p>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",lineHeight:1.2}}>{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Font</p>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {NOTE_FONTS.map(f=>{
                    const isActive=(entry.font||'')===f.id;
                    return (
                      <button key={f.id} onClick={()=>upd("font",f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:9,border:`1.5px solid ${isActive?"var(--accent)":"var(--line)"}`,background:isActive?"var(--accent-soft)":"transparent",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                        <span style={{fontFamily:f.family,fontSize:"1.1rem",fontWeight:500,color:isActive?"var(--accent)":"var(--ink)",width:28,textAlign:"center",flexShrink:0}}>{f.sample}</span>
                        <div>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isActive?"var(--accent)":"var(--ink2)",fontWeight:isActive?600:400,lineHeight:1.2}}>{f.label}</p>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",lineHeight:1.2}}>{f.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mood-col">
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Perasaan</p>
                {MOODS.map((m,i) => (
                  <button key={i} className="mood-chip" onClick={()=>upd("mood",entry.mood===i?null:i)} style={{border:entry.mood===i?`1.5px solid ${m.color}`:undefined,background:entry.mood===i?m.bg:undefined,color:entry.mood===i?m.color:"var(--ink2)",fontWeight:entry.mood===i?500:400,justifyContent:"flex-start"}}><span style={{fontSize:"1rem"}}>{m.emoji}</span>{m.label}</button>
                ))}
              </div>
              <div style={{marginTop:20}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Label</p>
                {(entry.tags||[]).length > 0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                    {(entry.tags||[]).map((t:string) => (
                      <span key={t} className="tag-chip" onClick={()=>removeTag(t)}>#{t} ×</span>
                    ))}
                  </div>
                )}
                <input className="tag-input" placeholder="+ tambah label, Enter" value={tagInput}
                  onChange={(e:any)=>setTagInput(e.target.value)}
                  onKeyDown={(e:any)=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(tagInput);setTagInput('');}}}
                />
                {tagInput.trim() && allTags.filter(({tag})=>tag.includes(tagInput.replace(/^#+/,'').toLowerCase())&&!(entry.tags||[]).includes(tag)).slice(0,5).map(({tag})=>(
                  <div key={tag} style={{padding:"4px 10px",cursor:"pointer",fontSize:".76rem",fontFamily:"'Lora',serif",color:"var(--ink2)",borderRadius:6,transition:"background .1s"}} onClick={()=>{addTag(tag);setTagInput('');}}
                    onMouseEnter={(e:any)=>e.currentTarget.style.background="var(--bg)"}
                    onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}>#{tag}</div>
                ))}
              </div>
            </div>

            <div className="write-main s3" style={{animation:"pgIn .38s cubic-bezier(.23,1,.32,1) .05s both"}}>
              {/* Mobile: compact date (sidebar is hidden on mobile) */}
              <div className="mob-only" style={{alignItems:"center",gap:10,marginBottom:22,paddingBottom:18,borderBottom:"1px solid var(--line)"}}>
                <div style={{flex:1}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.65rem",fontWeight:300,color:"var(--ink)",lineHeight:1}}>{new Date(entry.date+"T00:00:00").getDate()}</p>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",marginTop:3}}>{MONTHS[new Date(entry.date+"T00:00:00").getMonth()]} {new Date(entry.date+"T00:00:00").getFullYear()} · {DAYS_SHORT[new Date(entry.date+"T00:00:00").getDay()]}{timeStr(entry.ts)?` · ${timeStr(entry.ts)}`:""}</p>
                </div>
                <button onClick={()=>setShowMobStyle(true)} style={{padding:"8px 16px",borderRadius:20,border:"1px solid var(--line)",background:"var(--surface)",fontSize:".78rem",color:"var(--ink2)",fontFamily:"'Lora',serif",display:"flex",alignItems:"center",gap:5,cursor:"pointer",flexShrink:0,transition:"background .15s"}}>
                  🎨 Gaya
                </button>
              </div>
              <div style={{marginBottom:20}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",marginBottom:8,letterSpacing:".06em",textTransform:"uppercase"}}>Perasaan</p>
                <div className="mood-grid">
                  {MOODS.map((m,i) => (
                    <button key={i} className="mood-chip" onClick={()=>upd("mood",entry.mood===i?null:i)} style={{border:entry.mood===i?`1.5px solid ${m.color}`:undefined,background:entry.mood===i?m.bg:undefined,color:entry.mood===i?m.color:"var(--ink2)",fontWeight:entry.mood===i?500:400,transition:"all .18s"}}><span style={{fontSize:"1rem"}}>{m.emoji}</span>{m.label}</button>
                  ))}
                </div>
              </div>

              <input type="text" className="write-title-inp" value={entry.title||""} onChange={(e: any)=>upd("title",e.target.value)} placeholder="Judul (opsional)" style={{fontSize:"1.85rem",fontWeight:400,letterSpacing:"-0.02em",marginBottom:20,fontFamily:entryFontFamily(entry)}}/>

              {entry.stickers?.length > 0 && (
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:16}}>
                  {entry.stickers.map((s: string,i: number) => (
                    <span key={i} onClick={()=>toggleSticker(s)} style={{fontSize:"1.3rem",cursor:"pointer",transition:"transform .15s",padding:2,borderRadius:6,background:"var(--accent-soft)",display:"inline-flex"}}>{s}</span>
                  ))}
                </div>
              )}

              <LiveEditor entries={entries} text={entry.text||""} onChange={t=>upd("text",t)} onUploadImage={uploadImage} onDone={()=>nav("read",selId)} onShowToast={showInfoToast} placeholder={getPrompt(entry.date)} autoFocus fontSize={fontSizeRem} fontFamily={entryFontFamily(entry)}/>

              <div className="mob-only" style={{marginTop:22,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,paddingTop:14,borderTop:"1px solid var(--line)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{calcReadingTime(entry.text)} mnt · {getPreviewText(entry.text||"").trim().split(/\s+/).filter(Boolean).length} kata</span>
                  <div style={{display:"flex",alignItems:"center",gap:3,background:"var(--bg)",borderRadius:8,padding:"2px 4px",border:"1px solid var(--line)"}}>
                    <button className="gb" onClick={()=>changeFontSize(-1)} disabled={fontSize===0} style={{fontSize:".7rem",padding:"3px 7px",opacity:fontSize===0?.35:1,minWidth:28}}>A−</button>
                    <div style={{width:1,height:14,background:"var(--line)"}}/>
                    <button className="gb" onClick={()=>changeFontSize(1)} disabled={fontSize===2} style={{fontSize:".85rem",padding:"3px 7px",opacity:fontSize===2?.35:1,minWidth:28}}>A+</button>
                  </div>
                  <button className="gb" onClick={()=>setShowStickers(!showStickers)} style={{fontSize:".8rem",color:showStickers?"var(--accent)":"var(--ink2)",transition:"color .15s"}}><Ic d={IC.sticker} size={15} sw={1.4}/>Stiker{entry.stickers?.length?` · ${entry.stickers.length}`:""}</button>
                </div>
                {entry.text?.trim() && (
                  <button onClick={()=>nav("read",selId)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:20,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".84rem",fontWeight:500,cursor:"pointer",boxShadow:"0 4px 12px rgba(196,149,106,.3)",animation:"fabIn .25s cubic-bezier(.23,1,.32,1) both",transition:"transform .15s,box-shadow .15s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLElement).style.boxShadow="0 6px 18px rgba(196,149,106,.4)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="";(e.currentTarget as HTMLElement).style.boxShadow="0 4px 12px rgba(196,149,106,.3)";}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    Selesai
                  </button>
                )}
              </div>
              {/* Desktop fixed finish button rendered via portal below */}

              {showStickers && (
                <div style={{marginTop:16}}>
                  <StickerPicker stickers={entry.stickers||[]} onToggle={toggleSticker} onClose={()=>setShowStickers(false)}/>
                </div>
              )}
            </div>
          </div>
        </div>)}

        {/* ════════ DESKTOP FIXED SELESAI BUTTON ════════ */}
        {view==="write" && entry?.text?.trim() && (
          <button
            className="desk-only desk-selesai-fab"
            onClick={()=>nav("read",selId)}
            onMouseEnter={e=>{const b=e.currentTarget;b.style.transform="translateY(-3px) scale(1.03)";b.style.boxShadow="0 14px 36px rgba(196,149,106,.55)";}}
            onMouseLeave={e=>{const b=e.currentTarget;b.style.transform="";b.style.boxShadow="0 6px 24px rgba(196,149,106,.38)";}}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Selesai
          </button>
        )}

        {/* ════════ READ ════════ */}
        {view==="read" && entry && (<div>
          {focusMode ? (
            <button className="focus-exit-btn no-print" onClick={()=>setFocusMode(false)}>
              <Ic d={IC.minimize} size={14} sw={1.6}/>Keluar Fokus
            </button>
          ) : (
          <div className="s1 no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:40}}>
            <button className="gb" onClick={()=>nav("home")}><Ic d={IC.back} size={17}/>Beranda</button>
            <button className="mob-only gb" onClick={()=>setShowMobActions(true)} style={{padding:"6px 8px"}}><Ic d={IC.dots} size={22} sw={2.5}/></button>
          </div>
          )}

          <div className="read-layout" ref={exportRef} data-export-root>
            {entry.stickers?.length > 0 && <StickerDisplay stickers={entry.stickers}/>}
            <div style={{position:"relative",zIndex:1}}>
              <div className="s2" style={{width:40,height:2,borderRadius:1,background:readMood?.color||"var(--accent-soft)",marginBottom:20,transition:"background .5s"}}/>
              <div className="s2" style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:readMood?.color||"var(--ink2)",letterSpacing:".04em"}}>{fullD(entry.date)}</p>
                {timeStr(entry.ts) && <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>· {timeStr(entry.ts)}</span>}
                {entry.isImported && (
                  <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 7px",borderRadius:6,background:isDarkApp?"rgba(255,255,255,.1)":"rgba(0,0,0,.05)",color:"var(--ink3)",fontWeight:500,border:"1px solid var(--line)",display:"inline-flex",alignItems:"center",gap:3,marginLeft:4}}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Koleksi Impor
                  </span>
                )}
              </div>
              <div className="s3" style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:20}}>
                {readMood && <span className="mood-chip" style={{border:`1px solid ${readMood.border}`,background:readMood.bg,color:readMood.color,cursor:"default"}}><span style={{fontSize:".95rem"}}>{readMood.emoji}</span>{readMood.label}</span>}
                {entry.stickers?.length > 0 && <div style={{display:"flex",gap:3}}>{entry.stickers.map((s: string,i: number) => <span key={i} style={{fontSize:"1.2rem",padding:2}}>{s}</span>)}</div>}
              </div>
              {(entry.tags||[]).length > 0 && (
                <div className="s3" style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                  {(entry.tags||[]).map((t:string)=>(
                    <span key={t} className="tag-chip" style={{cursor:"default"}}>#{t}</span>
                  ))}
                </div>
              )}
              {entry.title && <h1 className="s3" style={{fontFamily:entryFontFamily(entry),fontSize:"clamp(2rem,4vw,2.8rem)",fontWeight:400,color:"var(--ink)",marginBottom:28,lineHeight:1.2,maxWidth:"90%"}}>{entry.title}</h1>}
              {(() => {
                const text = entry.text || '';
                if (!text) return <div className="s4"><span style={{color:"var(--ink3)",fontStyle:"italic",fontFamily:"'Lora',serif",fontSize:"1rem"}}>Catatan ini masih kosong.</span></div>;
                const rBlocks = parseBlocks(text);
                const todoBlocks = rBlocks.filter(b => b.type === 'todo');
                const doneCount = todoBlocks.filter(b => b.type === 'todo' && b.done).length;
                const hasTodos = todoBlocks.length > 0;
                const sizeW: Record<string,string> = { sm:'40%', md:'65%', lg:'85%', full:'100%' };
                return (
                  <div className="s4">
                    {hasTodos && (
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                        <div style={{flex:1,height:3,borderRadius:3,background:"var(--line)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.round(doneCount/todoBlocks.length*100)}%`,background:readMood?.color||"var(--accent)",borderRadius:3,transition:"width .4s ease"}}/>
                        </div>
                        <span style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--ink3)",whiteSpace:"nowrap"}}>{doneCount}/{todoBlocks.length} selesai</span>
                      </div>
                    )}
                    {rBlocks.map((blk, bi) => {
                      if (blk.type === 'image') {
                        const w = sizeW[blk.size||'full'] || '100%';
                        return (
                          <div key={bi} style={{margin:"16px 0",width:w,marginTop:16,marginBottom:16,...(blk.align==='center'?{marginLeft:'auto',marginRight:'auto'}:blk.align==='right'?{marginLeft:'auto',marginRight:0}:{}),borderRadius:12,overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setLightboxUrl(blk.url)}>
                            <img src={blk.url} alt="" style={{width:"100%",display:"block",borderRadius:12,maxHeight:520,objectFit:"cover"}}/>
                          </div>
                        );
                      }
                      if (blk.type === 'gallery') {
                        return (
                          <div key={bi} style={{margin:"16px 0",display:"grid",gridTemplateColumns:`repeat(${blk.cols},1fr)`,gap:6,borderRadius:12,overflow:"hidden"}}>
                            {blk.urls.map((url,j) => (
                              <div key={j} style={{aspectRatio:"1",borderRadius:8,overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setLightboxUrl(url)}>
                                <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (blk.type === 'todo') {
                        const accentColor = readMood?.color || 'var(--accent)';
                        // find original line index for toggleTodoLine
                        const rawLines = text.split('\n');
                        const rawLineIdx = rawLines.findIndex((l: any,li: number) => {
                          let seen = 0;
                          for (let k = 0; k <= li; k++) if (/^--x?\s|^--$|^--x$/.test(rawLines[k])) seen++;
                          return seen === rBlocks.slice(0, bi+1).filter(b=>b.type==='todo').length && /^--x?\s|^--$|^--x$/.test(rawLines[li]);
                        });
                        return (
                          <div key={bi} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid var(--line)"}}>
                            <button onClick={()=>upd('text', toggleTodoLine(entry.text, rawLineIdx))} style={{flexShrink:0,width:22,height:22,borderRadius:"50%",border:`2px solid ${blk.done?accentColor:"var(--ink3)"}`,background:blk.done?accentColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .2s"}}>
                              {blk.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </button>
                            <span style={{fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem}rem`,lineHeight:1.7,color:blk.done?"var(--ink3)":"var(--ink)",textDecoration:blk.done?"line-through":"none",flex:1}}>{renderInline(blk.content)}</span>
                          </div>
                        );
                      }
                      if (blk.type === 'link') {
                        let hostname = '';
                        try { hostname = new URL(blk.url).hostname; } catch(_) {}
                        return (
                          <div key={bi} style={{margin:"12px 0"}}>
                            <a href={blk.url} target="_blank" rel="noopener noreferrer"
                              style={{display:"flex",gap:12,padding:"12px 14px",borderRadius:12,border:"1px solid var(--line)",background:"var(--bg)",textDecoration:"none",color:"inherit",overflow:"hidden"}}>
                              {blk.image && <img src={blk.image} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:8,flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                                  {blk.favicon && <img src={blk.favicon} alt="" style={{width:13,height:13,borderRadius:2,flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
                                  <span style={{fontSize:".68rem",color:"var(--ink3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hostname}</span>
                                </div>
                                <div style={{fontFamily:entryFontFamily(entry),fontSize:".88rem",fontWeight:600,color:"var(--ink)",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{blk.title||blk.url}</div>
                                {blk.description && <div style={{fontSize:".76rem",color:"var(--ink2)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{blk.description}</div>}
                              </div>
                            </a>
                          </div>
                        );
                      }
                      if (blk.type === 'table') {
                        const cols = blk.rows[0]?.length || 1;
                        return (
                          <div key={bi} style={{margin:"12px 0",overflowX:"auto"}}>
                            <table style={{borderCollapse:"collapse",width:"100%",fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem*0.9}rem`}}>
                              <tbody>
                                {blk.rows.map((row,r) => (
                                  <tr key={r}>
                                    {row.map((cell,c) => (
                                      <td key={c} style={{border:"1px solid var(--line)",padding:"7px 10px",color:"var(--ink)",fontWeight:r===0?600:400,background:r===0?"var(--bg)":"transparent",minWidth:60}}>{renderInline(cell)}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      // text block — HTML (new) or plain markdown (legacy)
                      if (/<(?:div|br|strong|em|span|u|code|hr|s|a|pre|h[1-6])\b/i.test(blk.content)) {
                        return <div key={bi} className="rich-read" style={{fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem}rem`,lineHeight:fontLineH,color:"var(--ink)",wordBreak:"break-word"}} dangerouslySetInnerHTML={{__html:linkZettel(blk.content)}}/>;
                      }
                      return (
                        <div key={bi} className="rich-read">
                          {blk.content.split('\n').map((line, li) => {
                            if (!line) return <div key={`${bi}-${li}`} style={{height:"1.1rem"}}/>;
                            const {align, text} = parseLineStyle(line);
                            const bMatch = text.match(/^(\s*)([-*•])\s(.*)/);
                            const nMatch = text.match(/^(\s*)(\d+)\.\s(.*)/);
                            const hMatch = text.match(/^(\s*)(#+)\s(.*)/);
                            if (hMatch) {
                              const level = Math.min(6, hMatch[2].length);
                              const Tag = `h${level}` as any;
                              return <Tag key={`${bi}-${li}`} style={{fontFamily:entryFontFamily(entry),color:"var(--ink)",textAlign:align as any,wordBreak:"break-word"}}>{renderInline(hMatch[3])}</Tag>;
                            }
                            if (bMatch) {
                              return (
                                <div key={`${bi}-${li}`} style={{display:"flex",gap:8,textAlign:align as any,marginBottom:4}}>
                                  <span style={{opacity:.45,flexShrink:0}}>{bMatch[2]}</span>
                                  <span style={{flex:1}}>{renderInline(bMatch[3])}</span>
                                </div>
                              );
                            }
                            if (nMatch) {
                              return (
                                <div key={`${bi}-${li}`} style={{display:"flex",gap:8,textAlign:align as any,marginBottom:4}}>
                                  <span style={{opacity:.45,flexShrink:0,minWidth:"1.2em"}}>{nMatch[2]}.</span>
                                  <span style={{flex:1}}>{renderInline(nMatch[3])}</span>
                                </div>
                              );
                            }
                            return <p key={`${bi}-${li}`} style={{fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem}rem`,lineHeight:fontLineH,color:"var(--ink)",wordBreak:"break-word",textAlign:align as any}}>{renderInline(text)}</p>;
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {/* {(SENSITIVE_REGEX.test(entry.title || "") || SENSITIVE_REGEX.test(entry.text || "")) && (
                <div style={{marginTop:40,marginBottom:20,padding:24,borderRadius:22,background:"rgba(196,149,106,0.06)",border:"1px solid var(--line)",textAlign:"center"}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".84rem",color:"var(--ink2)",marginBottom:16,lineHeight:1.6}}>
                    Kami mendeteksi kalimat yang menunjukkan kamu mungkin sedang dalam kesulitan. 
                    <span style={{display:"block",marginTop:4,fontWeight:600,color:"var(--ink)"}}>Tenang saja, teks kamu aman dan terenkripsi secara privasi.</span>
                    Kami peduli padamu dan ingin kamu tahu bahwa ada bantuan yang tersedia.
                  </p>
                  <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 28px",borderRadius:16,background:"var(--accent)",color:"#fff",textDecoration:"none",fontFamily:"'Lora',serif",fontSize:".9rem",fontWeight:600,boxShadow:"0 4px 15px rgba(196,149,106,0.25)"}}>
                    🫂 Kamu tidak sendiri
                  </a>
                </div>
              )} */}
              {entry.text && (
                <div className="s5" style={{marginTop:48}}>
                  <div className="line-h" style={{marginBottom:16}}/>
                  <div className="no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{calcReadingTime(entry.text)} mnt baca · {getPreviewText(entry.text||"").trim().split(/\s+/).filter(Boolean).length} kata</p>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button className="gb" onClick={()=>changeFontSize(-1)} disabled={fontSize===0} style={{fontSize:".7rem",padding:"2px 6px",opacity:fontSize===0?.4:1}}>A−</button>
                      <button className="gb" onClick={()=>changeFontSize(1)} disabled={fontSize===2} style={{fontSize:".85rem",padding:"2px 6px",opacity:fontSize===2?.4:1}}>A+</button>
                    </div>
                  </div>
                </div>
              )}
              {(byDate[entry.date]||[]).filter((e: any)=>e.id!==selId && e.text?.trim()).length>0 && (
                <div className="s5 no-print" style={{marginTop:24}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",marginBottom:12,letterSpacing:".04em"}}>Catatan lain di hari yang sama</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {(byDate[entry.date]||[]).filter((e: any)=>e.id!==selId && e.text?.trim()).map((e: any) => {
                      const m=entryMood(e);
                      const eTheme=e.theme?NOTE_THEMES.find((t:any)=>t.id===e.theme):null;
                      const eColor=e.color?NOTE_COLORS.find((c:any)=>c.id===e.color):null;
                      const isLocked = e.isLocked && !unlockedIds.includes(e.id);
                      return (
                        <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||m?.border||"var(--line)",background:(isDarkApp&&!(eTheme as any)?.dark)?"var(--surface)":eTheme?.bg||eColor?.bg||m?.bg||"var(--surface)",padding:"14px 18px",position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:(eTheme||eColor||m)?{"--ink":"#000000","--ink2":"#111111","--ink3":"#333333"}:{})} as any}>
                          {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                           {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={16} color="var(--accent)"/></div>}
                           <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                             <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                               <div style={{display:"flex",alignItems:"center",gap:6}}>
                                 <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{timeStr(e.ts)}</span>
                                 {e.stickers?.length>0 && <span style={{fontSize:".6rem"}}>{e.stickers.slice(0,3).join("")}</span>}
                               </div>
                               {m && <span style={{fontSize:".82rem"}}>{m.emoji}</span>}
                             </div>
                             {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:".98rem",fontWeight:500,color:"var(--ink)",marginBottom:2}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                             {(()=>{const ogI=!isLocked&&getLinkImage(e.text||'');return(<div style={{display:"flex",gap:8,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink2)",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,flex:1}}>{isLocked?makeDummy(Math.min(e.textWords||12,20),e.id+'x'):getPreviewText(e.text||'')}</p>{ogI&&<img src={ogI} alt="" style={{width:46,height:46,objectFit:"cover",borderRadius:7,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>);})()}
                           </div>
                         </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>)}

        {/* ════════ CALENDAR ════════ */}
        {view==="calendar" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:36}}>
            <button className="mob-only gb" onClick={()=>nav("home")}><Ic d={IC.back} size={17}/>Beranda</button>
            <h2 className="desk-only" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:400,color:"var(--ink)"}}>Kalender</h2>
          </div>
          <div className="cal-layout">
            <div className="cal-grid-wrap">
              <div className="s2" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <button className="gb" onClick={()=>{if(cM===0){setCM(11);setCY(cY-1)}else setCM(cM-1)}}><Ic d={IC.chevL} size={18} sw={1.8}/></button>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:500,color:"var(--ink)"}}>{MONTHS[cM]} {cY}</span>
                <button className="gb" onClick={()=>{if(cM===11){setCM(0);setCY(cY+1)}else setCM(cM+1)}}><Ic d={IC.chevR} size={18} sw={1.8}/></button>
              </div>
              <div className="s3" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
                {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",letterSpacing:".08em",padding:"6px 0"}}>{d}</div>)}
              </div>
              <div className="s4" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,justifyItems:"center"}}>
                {Array.from({length:firstDay(cY,cM)}).map((_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:daysInMonth(cY,cM)}).map((_,i)=>{
                  const day=i+1;
                  const ds=`${cY}-${String(cM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const has=hasDate(ds); const isT=ds===todayStr; const m=dateMood(ds);
                  const cnt=(byDate[ds]||[]).length;
                  return (
                    <button key={day} className="cal-day"
                      onClick={()=>{ if(has&&cnt===1)nav("read",(byDate[ds]||[])[0].id); else if(has)nav("dayview",ds); else newEntry(ds); }}
                      style={{background:has?(m?.soft||"var(--accent-soft)"):"none",fontWeight:has?600:400,border:isT?"1.5px solid var(--accent)":"1.5px solid transparent",color:has&&m?m.color:"var(--ink)"}}>
                      {day}
                      {has&&<span style={{position:"absolute",bottom:2,width:4,height:4,borderRadius:"50%",background:m?.color||"var(--accent)"}}/>}
                      {cnt>1&&<span style={{position:"absolute",top:1,right:1,fontSize:".5rem",color:m?.color||"var(--accent)",fontWeight:700}}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{marginTop:28,display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center"}}>
                {MOODS.map((m,i)=><span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink2)"}}><span style={{width:8,height:8,borderRadius:"50%",background:m.color,display:"inline-block"}}/>{m.label}</span>)}
              </div>
            </div>
            <div className="cal-sidebar s5">
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:500,color:"var(--ink)",marginBottom:16}}>Bulan Ini</h3>
              <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:20,lineHeight:1.6}}>{monthEntries.length} catatan</p>
              {Object.keys(moodCounts).length>0 && (
                <div>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",letterSpacing:".05em",marginBottom:12}}>Suasana hati</p>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {Object.entries(moodCounts).sort((a,b)=>(b[1] as number)-(a[1] as number)).map(([mi,count])=>{
                      const m=MOODS[parseInt(mi)]; const pct=Math.round(((count as number)/monthEntries.length)*100);
                      return (<div key={mi}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <span style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink2)",display:"flex",alignItems:"center",gap:6}}><span>{m.emoji}</span>{m.label}</span>
                          <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{count as number}×</span>
                        </div>
                        <div style={{height:4,borderRadius:2,background:"var(--line)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:m.color,width:`${pct}%`,transition:"width .5s ease"}}/></div>
                      </div>);
                    })}
                  </div>
                </div>
              )}
              {monthEntries.length===0 && <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",fontStyle:"italic"}}>Belum ada catatan.</p>}
            </div>
          </div>
        </div>)}

        {/* ════════ DAY VIEW ════════ */}
        {view==="dayview" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
            <button className="gb" onClick={()=>nav("calendar")}><Ic d={IC.back} size={17}/>Kalender</button>
            <button className="gb" onClick={()=>newEntry(selId as any)} style={{color:"var(--accent)",fontSize:".82rem"}}><Ic d={IC.plus} size={14} sw={2}/> Tulis lagi</button>
          </div>
          <h2 className="s2" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.6rem",fontWeight:400,color:"var(--ink)",marginBottom:6}}>{fullD(selId || '')}</h2>
          <p className="s2" style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",marginBottom:24}}>{(byDate[selId as any]||[]).length} catatan</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(byDate[selId as any]||[]).map((e: any,i: number)=>{
              const m=entryMood(e);
              const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
              const isLocked = e.isLocked && !unlockedIds.includes(e.id);
              return (
                <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||m?.border||"var(--line)",background:(isDarkApp&&!(eTheme as any)?.dark)?"var(--surface)":eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",animation:`fadeUp .4s ease ${i*.06}s both`,position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:isDarkApp?{}:(eTheme||e.color||m)?{"--ink":"#000000","--ink2":"#111111","--ink3":"#333333"}:{})} as any}>
                   {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                   {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={18} color="var(--accent)"/></div>}
                   {(()=>{const isDarkCard=(eTheme as any)?.dark;const dInk=isDarkCard?"#E8F8F6":(!isDarkApp&&(eTheme||e.color||m))?"#000000":"var(--ink)";const dInk2=isDarkCard?"rgba(168,228,222,.90)":(!isDarkApp&&(eTheme||e.color||m))?"#111111":"var(--ink2)";const dInk3=isDarkCard?"rgba(110,188,182,.72)":(!isDarkApp&&(eTheme||e.color||m))?"#333333":"var(--ink3)";const hasLinkD=!isLocked&&(e.text||'').includes('[LINK:');const lColorD=eTheme?.accent||"#C4952A";return(
                   <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                       <div style={{display:"flex",alignItems:"center",gap:8}}>
                         <span style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:dInk3}}>{timeStr(e.ts)}</span>
                         {e.stickers?.length>0 && <span style={{fontSize:".7rem",opacity:.7}}>{e.stickers.slice(0,4).join("")}</span>}
                       </div>
                       <div style={{display:"flex",alignItems:"center",gap:8}}>
                         {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",padding:"1px 6px",borderRadius:6,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                         {m && <span className="mood-chip" style={{border:`1px solid ${isDarkApp?"var(--line)":m.border}`,background:isDarkApp?"var(--surface2)":m.bg,color:isDarkApp?"var(--ink2)":m.color,cursor:"default",padding:"3px 10px 3px 7px",fontSize:".72rem"}}><span style={{fontSize:".85rem"}}>{m.emoji}</span>{m.label}</span>}
                         <button className="gb del-icon" onClick={ev=>{ev.stopPropagation();requestDelete(e)}}><Ic d={IC.trash} size={13}/></button>
                       </div>
                     </div>
                     {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:500,color:dInk,marginBottom:6}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                     {(()=>{const ogI=!isLocked&&getLinkImage(e.text||'');return(<div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".86rem",color:hasLinkD?lColorD:dInk2,lineHeight:1.65,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:4,WebkitBoxOrient:"vertical" as const,flex:1}}>{isLocked?makeDummy(Math.min(e.textWords||15,35),e.id+'x'):getPreviewText(e.text||'')}</p>{ogI&&<img src={ogI} alt="" style={{width:58,height:58,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>);})()}
                   </div>);})()}
                 </div>
              );
            })}
          </div>
        </div>)}

        {/* ════════ LIST ════════ */}
        {view==="list" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <button className="mob-only gb" onClick={()=>nav("home")}><Ic d={IC.back} size={17}/></button>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:400,color:"var(--ink)"}}>Semua Catatan</h2>
              <button onClick={()=>{setSelectMode(s=>!s);setSelectedIds(new Set());}} style={{fontFamily:"'Lora',serif",fontSize:".74rem",padding:"4px 12px",borderRadius:20,border:`1px solid ${selectMode?"var(--accent)":"var(--line)"}`,background:selectMode?"var(--accent)":"transparent",color:selectMode?"#fff":"var(--ink2)",cursor:"pointer",transition:"all .18s"}}>{selectMode?"Batal":"Pilih"}</button>
            </div>
            {/* Desktop: always-visible search */}
            <div className="desk-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.5" strokeLinecap="round" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><path d={IC.search}/></svg>
              <input ref={searchInputRef} className="search-bar" type="text" value={q} onChange={(e:any)=>setQ(e.target.value)} placeholder="Cari catatan atau @nama pengguna..." style={{paddingLeft:42}}/>
            </div>
            {/* Mobile: toggle button */}
            <button className="mob-only gb" onClick={()=>setShowSearch(!showSearch)} style={{color:showSearch?"var(--accent)":"var(--ink2)"}}><Ic d={IC.search} size={17}/></button>
          </div>
          {/* Mobile: toggle search bar */}
          {showSearch && (
            <div className="mob-only" style={{position:"relative",marginBottom:16,animation:"fadeUp .3s ease both"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.5" strokeLinecap="round" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}><path d={IC.search}/></svg>
              <input className="search-bar" type="text" value={q} onChange={(e:any)=>setQ(e.target.value)} placeholder="Cari catatan atau @nama pengguna..." autoFocus/>
            </div>
          )}
          {q.startsWith("@") ? (
            /* ── User search results ── */
            <div style={{animation:"fadeUp .3s ease both"}}>
              <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",marginBottom:14}}>
                {userSearchLoading ? "Mencari pengguna..." : userResults.length > 0 ? `${userResults.length} pengguna ditemukan` : q.slice(1).trim() ? "Tidak ada pengguna ditemukan." : "Ketik nama atau username untuk mencari."}
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {userResults.map((u,i)=>(
                  <a key={u.id} href={`/profile/${u.id}`}
                    style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",textDecoration:"none",animation:`fadeUp .3s ease ${i*.04}s both`}}>
                    <div style={{width:46,height:46,borderRadius:"50%",background:"var(--accent-soft)",border:"2px solid rgba(196,149,106,.2)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {u.image
                        ? <img src={u.image} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
                        : <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.3rem",color:"var(--accent)",fontWeight:300}}>{(u.name||"?")[0].toUpperCase()}</span>
                      }
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".92rem",color:"var(--ink)",fontWeight:500,margin:0}}>{u.name}</p>
                        {u.isSuspended && <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",fontWeight:600,color:"#B85050",background:"#FFF0F0",border:"1px solid #FFCDCD",borderRadius:5,padding:"1px 6px",letterSpacing:".04em"}}>SUSPENDED</span>}
                      </div>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink3)",margin:"1px 0 0"}}>
                        {u.username && <span style={{color:"var(--accent)",fontWeight:500}}>@{u.username} · </span>}
                        {u.sharedCount} catatan dibagikan
                      </p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </a>
                ))}
              </div>
              {!q.slice(1).trim() && (
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px",borderRadius:16,background:"var(--accent-soft)",border:"1px solid rgba(196,149,106,.2)",marginTop:4}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--accent)",margin:0}}>Ketik <strong>@nama</strong> atau <strong>@username</strong> untuk menemukan pengguna.</p>
                </div>
              )}
            </div>
          ) : (
            /* ── Normal note list ── */
            <>
          {/* Tag filter row */}
          {allTags.length > 0 && (
            <div className="tag-filter-row">
              {activeTag && <span className="tag-chip active" onClick={()=>setActiveTag(null)}>× semua</span>}
              {allTags.map(({tag,count})=>(
                <span key={tag} className={`tag-chip ${activeTag===tag?"active":""}`} onClick={()=>setActiveTag(activeTag===tag?null:tag)}>
                  #{tag} <span style={{opacity:.6,fontSize:".6rem"}}>{count}</span>
                </span>
              ))}
            </div>
          )}
          <p className="s2" style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",marginBottom:20}}>{filtered.length} catatan{(q.trim()||activeTag)?" ditemukan":""}</p>
          <div className="list-grid">
            {filtered.map((e: any,i: number)=>{
              const m=entryMood(e); const sameDay=(byDate[e.date]||[]).length;
              const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
              const isLocked = e.isLocked && !unlockedIds.includes(e.id);
              const isDarkCard=(eTheme as any)?.dark;
              const dInk=isDarkCard?"#E8F8F6":(!isDarkApp&&(eTheme||e.color||m))?"#000000":"var(--ink)";
              const dInk2=isDarkCard?"rgba(168,228,222,.90)":(!isDarkApp&&(eTheme||e.color||m))?"#111111":"var(--ink2)";
              const hasLink=!isLocked&&(e.text||'').includes('[LINK:');
              const linkColor=eTheme?.accent||"#C4952A";
              const isSelected=selectedIds.has(e.id);
              return (
                <div key={e.id} className="ecard" onClick={() => {
                  if(selectMode){const s=new Set(selectedIds);s.has(e.id)?s.delete(e.id):s.add(e.id);setSelectedIds(s);}
                  else nav("read",e.id);
                }} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.border:null)||m?.border||"var(--line)",background:(isDarkApp&&!(eTheme as any)?.dark)?"var(--surface)":eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",animation:`fadeUp .4s ease ${i*.03}s both`,position:"relative",outline:isSelected?"2.5px solid var(--accent)":"none",outlineOffset:"-2px",transition:"outline .12s"} as any}>
                   {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                   {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={18} color="var(--accent)"/></div>}
                   {selectMode && (
                     <div style={{position:"absolute",top:10,left:10,zIndex:4,width:20,height:20,borderRadius:"50%",border:`2px solid ${isSelected?"var(--accent)":"rgba(128,128,128,.5)"}`,background:isSelected?"var(--accent)":"rgba(255,255,255,.85)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                       {isSelected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                     </div>
                   )}
                   {!selectMode && e.isPinned && !isLocked && <div style={{position:"absolute",top:10,right:10,zIndex:3,color:"var(--accent)",opacity:.7}}><Ic d={IC.pin} size={12} sw={2}/></div>}
                   <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                       <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:selectMode?28:0,transition:"padding .12s"}}>
                         <span style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:eTheme?.accent||m?.color||dInk2}}>{shortD(e.date)}</span>
                         {sameDay>1 && <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:dInk2,background:"var(--surface2)",borderRadius:8,padding:"1px 6px"}}>{timeStr(e.ts)}</span>}
                       </div>
                       <div style={{display:"flex",alignItems:"center",gap:6}}>
                         {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 5px",borderRadius:5,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                         {e.stickers?.length>0 && <span style={{fontSize:".6rem",opacity:.6}}>{e.stickers.slice(0,2).join("")}</span>}
                         {m&&<span style={{fontSize:".85rem"}}>{m.emoji}</span>}
                         {!selectMode && <button className="gb del-icon" onClick={ev=>{ev.stopPropagation();requestDelete(e)}}><Ic d={IC.trash} size={13}/></button>}
                       </div>
                     </div>
                     {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.04rem",fontWeight:500,color:dInk,marginBottom:3}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                     {(()=>{const ogI=!isLocked&&getLinkImage(e.text||'');return(<div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:hasLink?linkColor:dInk2,lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as const,flex:1}}>{isLocked?makeDummy(Math.min(e.textWords||12,25),e.id+'x'):getPreviewText(e.text||'')}</p>{ogI&&<img src={ogI} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>);})()}
                     {(e.tags||[]).length > 0 && !isLocked && (
                       <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>
                         {(e.tags||[]).slice(0,3).map((t:string)=>(
                           <span key={t} className="tag-chip" style={{fontSize:".62rem",padding:"1px 6px",cursor:"default"}}>#{t}</span>
                         ))}
                         {(e.tags||[]).length > 3 && <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",color:"var(--ink3)"}}>+{(e.tags||[]).length-3}</span>}
                       </div>
                     )}
                   </div>
                 </div>
              );
            })}
          </div>
          {filtered.length===0 && <div style={{padding:"48px 0"}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.08rem",fontStyle:"italic",color:"var(--ink3)"}}>{(q.trim()||activeTag)?`Tidak ada catatan${activeTag?` dengan label #${activeTag}`:""}${q.trim()?" yang cocok":""}.`:"Belum ada catatan."}</p></div>}
            </>
          )}
        </div>)}
      </div>

        {/* ════════ MAP ════════ — always mounted, hidden via CSS */}
        <div style={{position:"fixed",inset:0,display:view==="map"?"flex":"none",flexDirection:"column",background:"var(--bg)",zIndex:10}}>
          {/* Header */}
          <div style={{height:56,display:"flex",alignItems:"center",gap:12,padding:"0 16px",borderBottom:"1px solid var(--line)",background:"var(--surface)",flexShrink:0,zIndex:1}}>
            <button onClick={()=>nav("home")} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{flex:1}}>
              <p style={{fontFamily:"'Lora',serif",fontSize:"1rem",fontWeight:600,color:"var(--ink)",margin:0}}>Peta Catatan</p>
            </div>
            <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>
              {notesWithLoc.length} {notesWithLoc.length === 1 ? "lokasi" : "lokasi"}
            </span>
          </div>

          {/* Map container */}
          <div style={{flex:1,position:"relative"}}>
            <div id="note-map-container" style={{width:"100%",height:"100%"}}/>

            {/* Empty state overlay */}
            {notesWithLoc.length === 0 && (
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:"var(--bg)",padding:32}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div style={{textAlign:"center"}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:"1rem",color:"var(--ink)",fontWeight:600,margin:"0 0 6px"}}>Belum ada catatan berlokasi</p>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",margin:0,lineHeight:1.5}}>Aktifkan <strong>Simpan lokasi catatan</strong> di Profil → Peta Catatan, lalu tulis catatan baru.</p>
                </div>
              </div>
            )}

            {/* Leaflet — always mounted */}
            <LeafletMap
              notes={notesWithLoc}
              mapRef={leafletMapRef}
              onOpenNote={onOpenMapNote}
              isDark={isDarkApp}
              isVisible={view === "map"}
            />
          </div>
        </div>

        {/* ════════ SETTINGS ════════ */}
        {view === "settings" && (() => {
          const STABS = [
            { id:"profile", label:"Profil", icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z", color:"rgba(196,149,106,.15)", stroke:"var(--accent)" },
            { id:"display", label:"Tampilan", icon:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0", color:"rgba(61,127,191,.12)", stroke:"#3D7FBF" },
            { id:"notif", label:"Notifikasi", icon:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0", color:"rgba(61,139,92,.12)", stroke:"#3D8B5C" },
            { id:"security", label:"Keamanan", icon:"M12 11v4m0 0h.01M7 10h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2zM9 10V7a3 3 0 016 0v3", color:"rgba(130,90,160,.12)", stroke:"#7A5A90" },
            { id:"stats", label:"Statistik", icon:"M18 20V10M12 20V4M6 20v-6", color:"rgba(196,149,60,.12)", stroke:"#B5902A" },
            { id:"data", label:"Data", icon:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3", color:"rgba(50,160,150,.12)", stroke:"#32A096" },
            { id:"account", label:"Akun", icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z", color:"rgba(181,112,90,.12)", stroke:"#B5705A" },
          ];
          const SettingRow = ({ label, sub, children }: any) => (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid var(--line)"}}>
              <div><p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink)",fontWeight:500,margin:0}}>{label}</p>{sub&&<p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",margin:0,marginTop:2}}>{sub}</p>}</div>
              <div>{children}</div>
            </div>
          );
          const SectionTitle = ({ title, sub }: any) => (
            <div style={{marginBottom:24,paddingTop:4}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.6rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1.1}}>{title}</h2>
              {sub && <p style={{fontFamily:"'Lora',serif",fontSize:".84rem",color:"var(--ink3)",marginTop:5}}>{sub}</p>}
              <div style={{height:3,width:40,borderRadius:1.5,background:"var(--accent)",marginTop:12,opacity:.8}}/>
            </div>
          );
          const MsgBox = ({ msg }: any) => msg.text ? (
            <div style={{padding:"12px 16px",borderRadius:12,border:`1px solid ${msg.type==="ok"?"var(--accent)":"rgba(181,112,90,.4)"}`,background:msg.type==="ok"?"var(--accent-soft)":"rgba(181,112,90,.12)",fontFamily:"'Lora',serif",fontSize:".84rem",color:msg.type==="ok"?"var(--accent)":"#B5705A",marginTop:16,display:"flex",alignItems:"center",gap:8}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={msg.type==="ok"?"M20 6L9 17l-5-5":"M18 6L6 18M6 6l12 12"}/></svg>
              {msg.text}
            </div>
          ) : null;
          const inputStyle: any = {width:"100%",padding:"12px 15px",borderRadius:12,border:"1.5px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".9rem",outline:"none",transition:"all .2s",boxSizing:"border-box"};
          const btnPrimary: any = {display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"13px 24px",borderRadius:14,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".9rem",fontWeight:500,cursor:"pointer",transition:"all .2s ease",boxShadow:"0 4px 12px rgba(196,149,106,0.15)"};
          const btnSecondary: any = {padding:"12px 24px",borderRadius:14,border:"1.5px solid var(--line)",background:"var(--surface)",color:"var(--ink2)",fontFamily:"'Lora',serif",fontSize:".9rem",fontWeight:500,cursor:"pointer",transition:"all .2s",display:"inline-flex",alignItems:"center",gap:8};
          const btnDanger: any = {padding:"12px 24px",borderRadius:14,border:"1.5px solid #E8C4B8",background:"linear-gradient(135deg,#C27054,#B5624A)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".9rem",fontWeight:500,cursor:"pointer",transition:"all .2s",boxShadow:"0 4px 12px rgba(194,112,84,0.1)"};
          const notifStatus = typeof Notification!=="undefined"?Notification.permission:"unsupported";

          const renderSection = (id: string) => {
            if (id === "profile") {
              const t = THEMES[profileTheme] || THEMES.cocoa;
              return (
                <div>
                  <style>{`
                    .st-profile-grid{display:flex;flex-direction:column;gap:24px}
                    @media(min-width:1024px){.st-profile-grid{display:grid;grid-template-columns:260px 1fr;gap:28px;align-items:start}}
                    .st-field-row{display:grid;gap:16px}
                    @media(min-width:600px){.st-field-row{grid-template-columns:1fr 1fr}}
                    .st-profile-input:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px rgba(196,149,106,.15)!important}
                    .st-theme-btn:hover .st-theme-swatch{transform:scale(1.04);box-shadow:0 4px 16px rgba(0,0,0,.12)!important}
                  `}</style>

                  <div className="st-profile-grid">

                    {/* ══ LEFT COLUMN: Identity ══ */}
                    <div style={{display:"flex",flexDirection:"column",gap:16}}>

                      {/* Avatar card */}
                      <div style={{borderRadius:20,border:"1.5px solid rgba(196,149,106,.2)",background:"linear-gradient(155deg,var(--accent-soft) 0%,var(--surface) 100%)",overflow:"hidden",boxShadow:"0 4px 20px rgba(196,149,106,.08)"}}>
                        <div style={{padding:"32px 20px 24px",textAlign:"center",position:"relative"}}>
                          <div style={{position:"absolute",top:-45,right:-35,width:130,height:130,borderRadius:"50%",background:"rgba(196,149,106,.07)",pointerEvents:"none"}}/>
                          <div style={{position:"absolute",bottom:-25,left:-20,width:90,height:90,borderRadius:"50%",background:"rgba(196,149,106,.05)",pointerEvents:"none"}}/>

                          {/* Avatar */}
                          <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
                            <div style={{width:104,height:104,borderRadius:"50%",background:"var(--accent-soft)",border:"3.5px solid var(--surface)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 28px rgba(196,149,106,.22)"}}>
                              {profileImage
                                ? <img src={profileImage} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                : <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"3rem",color:"var(--accent)",fontWeight:300,lineHeight:1}}>{(profileName||session?.user?.name||"?")[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <label style={{position:"absolute",bottom:2,right:2,width:32,height:32,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",cursor:avatarUploading?"not-allowed":"pointer",border:"3px solid var(--surface)",boxShadow:"0 3px 10px rgba(196,149,106,.35)",transition:"transform .15s, opacity .15s",opacity:avatarUploading?.55:1}}>
                              {avatarUploading
                                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                              }
                              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;setCropSrc(URL.createObjectURL(f));e.target.value="";}} disabled={avatarUploading}/>
                            </label>
                          </div>

                          {/* Name & meta */}
                          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.75rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1.1}}>{profileData?.name||session?.user?.name||"Pengguna"}</h2>
                          {profileData?.username && <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--accent)",margin:"5px 0 0",fontWeight:600,letterSpacing:".01em"}}>@{profileData.username}</p>}
                          <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",margin:"4px 0 0",lineHeight:1.4}}>{profileData?.email||session?.user?.email||""}</p>
                          {(() => {
                            const mInfo = medals.find(m => m.id === displayedMedal);
                            if (!mInfo) return null;
                            const isAdm = mInfo.id === "admin";
                            return (
                              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:isAdm?"#FFEDED":`${t.accent}14`, border:isAdm?"1px solid #FFCDCD":`1px solid ${t.accent}25`, borderRadius:50, padding:"3px 10px", marginTop:10 }}>
                                 <span style={{ fontSize:".9rem", lineHeight:1 }}>{mInfo.icon}</span>
                                 <span style={{ fontFamily:"'Lora',serif", fontSize:".65rem", color:isAdm?"#FF4D4D":t.accent, fontWeight:700, letterSpacing:".05em", textTransform:"uppercase" }}>{mInfo.label}</span>
                              </div>
                            );
                          })()}
                          {avatarUploading && (
                            <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--accent)",margin:"8px 0 0",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                              Mengupload foto...
                            </p>
                          )}
                        </div>

                        {/* Stats grid */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:"1px solid rgba(196,149,106,.15)"}}>
                          {[
                            {icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",val:allSorted.length,lbl:"Catatan",col:"var(--accent)"},
                            {icon:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",val:streak?.currentStreak||0,lbl:"Hari Streak",col:"#B5902A"},
                          ].map((s,i)=>(
                            <div key={i} style={{padding:"16px 12px",textAlign:"center",borderRight:i===0?"1px solid rgba(196,149,106,.15)":"none"}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",margin:"0 auto 6px"}}><path d={s.icon}/></svg>
                              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.6rem",fontWeight:400,color:s.col,margin:0,lineHeight:1}}>{s.val}</p>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",margin:0,marginTop:3,letterSpacing:".03em"}}>{s.lbl}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reactions card */}
                      {(()=>{
                        const rxTotal = profileReactions.reduce((s,r)=>s+r.count,0);
                        const rxActive = profileReactions.filter(r=>r.count>0);
                        return (
                          <div style={{borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",overflow:"hidden"}}>
                            <div style={{padding:"12px 16px",borderBottom:"1px solid var(--line)",background:"rgba(196,149,106,.03)",display:"flex",alignItems:"center",gap:8}}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Reaksi Diterima</p>
                              {rxTotal>0 && <span style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",marginLeft:"auto"}}>{rxTotal} total</span>}
                            </div>
                            <div style={{padding:"14px 16px"}}>
                              {rxTotal===0 ? (
                                <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",fontStyle:"italic",margin:0,textAlign:"center",padding:"4px 0"}}>Belum ada reaksi.</p>
                              ) : (
                                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                                  {rxActive.map(r=>(
                                    <div key={r.emoji} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:50,background:"rgba(196,149,106,.08)",border:"1px solid rgba(196,149,106,.18)"}}>
                                      <span style={{fontSize:".95rem",lineHeight:1}}>{r.emoji}</span>
                                      <span style={{fontFamily:"'Lora',serif",fontSize:".78rem",fontWeight:600,color:"var(--ink)"}}>{r.count}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Medali & Pencapaian */}
                      <div style={{borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",overflow:"hidden"}}>
                        <div style={{padding:"12px 16px",borderBottom:"1px solid var(--line)",background:"rgba(181,144,42,.03)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B5902A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Medali & Pencapaian</p>
                          </div>
                          <span style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",fontWeight:600}}>{medals.filter(m=>m.done).length}/20</span>
                        </div>
                      <div style={{padding:"16px",maxHeight:400,overflowY:"auto"}} className="custom-scrollbar">
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:12}}>
                          {medals.map(m => {
                            const isDisplayed = displayedMedal === m.id;
                            return (
                              <div key={m.id} title={m.desc} 
                                onClick={() => {
                                  if (!m.done) return;
                                  const next = isDisplayed ? null : m.id;
                                  setDisplayedMedal(next);
                                  // Save immediately for better UX
                                  fetch("/api/user/profile", {
                                    method: "PATCH",
                                    headers: {"Content-Type":"application/json"},
                                    body: JSON.stringify({ displayedMedal: next }),
                                  });
                                  setProfileData((p: any) => ({...p, displayedMedal: next}));
                                }}
                                style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",padding:"12px 8px",borderRadius:14,border:`1px solid ${isDisplayed?"var(--accent)":m.done?"var(--accent-soft)":"var(--line)"}`,background:isDisplayed?`${t.accent}12`:m.done?"var(--bg)":"transparent",opacity:m.done?1:0.35,filter:m.done?"none":"grayscale(1)",transition:"all .2s",cursor:m.done?"pointer":"default",position:"relative"}}>
                                {isDisplayed && (
                                  <div style={{position:"absolute",top:-6,right:-6,background:"var(--accent)",color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(0,0,0,.15)",zIndex:2}}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                                  </div>
                                )}
                                <span style={{fontSize:"1.6rem",marginBottom:8,display:"block"}}>{m.icon}</span>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",fontWeight:600,color:m.done?"var(--ink)":"var(--ink3)",margin:0,lineHeight:1.2}}>{m.label}</p>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".58rem",color:m.done?"var(--accent)":"var(--ink3)",margin:"3px 0 0",lineHeight:1.1}}>{m.done && isDisplayed ? "Dipajang sebagai Role" : m.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ══ RIGHT COLUMN: Edit form ══ */}
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>

                    {/* Edit form card */}
                    <div style={{borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",overflow:"hidden"}}>
                      <div style={{padding:"13px 18px",borderBottom:"1px solid var(--line)",background:"rgba(196,149,106,.03)",display:"flex",alignItems:"center",gap:8}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Edit Profil</p>
                      </div>

                      <div style={{padding:"20px 18px",display:"flex",flexDirection:"column",gap:16}}>
                        {/* Name field */}
                        <div>
                          <label style={{display:"block",fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:8,fontWeight:500,letterSpacing:".01em"}}>Nama Tampilan</label>
                          <input className="st-profile-input" style={{...inputStyle,background:"var(--bg)",transition:"border-color .2s, box-shadow .2s"}} value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="Nama kamu" maxLength={60}/>
                        </div>

                        {/* Username field */}
                        <div>
                          <label style={{display:"block",fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:8,fontWeight:500,letterSpacing:".01em"}}>Username Publik</label>
                          <div style={{position:"relative"}}>
                            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink3)",pointerEvents:"none",fontWeight:500}}>@</span>
                            <input className="st-profile-input"
                              style={{...inputStyle,background:"var(--bg)",paddingLeft:28,transition:"border-color .2s, box-shadow .2s"}}
                              value={profileUsername}
                              onChange={e=>setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,30))}
                              placeholder="username_kamu"
                              maxLength={30}
                            />
                          </div>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",margin:"6px 0 0",lineHeight:1.5}}>Huruf kecil, angka &amp; underscore saja · min. 3 karakter.</p>
                        </div>

                        {/* Bio field */}
                        <div style={{marginTop:4}}>
                          <label style={{display:"block",fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:8,fontWeight:500,letterSpacing:".01em"}}>Bio Singkat</label>
                          <textarea 
                            className="st-profile-input" 
                            style={{...inputStyle,background:"var(--bg)",height:80,padding:"10px 14px",resize:"none",transition:"border-color .2s, box-shadow .2s"}} 
                            value={profileBio} 
                            onChange={e=>setProfileBio(e.target.value)} 
                            placeholder="Ceritakan sedikit tentang dirimu..." 
                            maxLength={200}
                          />
                        </div>

                        {/* Social links */}
                        <div style={{marginTop:8}}>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,fontWeight:600,letterSpacing:".01em"}}>Media Sosial</p>
                          <div style={{display:"flex",flexDirection:"column",gap:12}}>
                             <div style={{display:"flex",alignItems:"center",gap:10}}>
                               <div style={{width:32,height:32,borderRadius:8,background:"#E1306C12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                               </div>
                               <input className="st-profile-input" style={{...inputStyle,background:"var(--bg)",flex:1}} value={profileInstagram} onChange={e=>setProfileInstagram(e.target.value)} placeholder="Username Instagram"/>
                             </div>
                             <div style={{display:"flex",alignItems:"center",gap:10}}>
                               <div style={{width:32,height:32,borderRadius:8,background:"#1DA1F212",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DA1F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                               </div>
                               <input className="st-profile-input" style={{...inputStyle,background:"var(--bg)",flex:1}} value={profileTwitter} onChange={e=>setProfileTwitter(e.target.value)} placeholder="Username Twitter / X"/>
                             </div>
                             <div style={{display:"flex",alignItems:"center",gap:10}}>
                               <div style={{width:32,height:32,borderRadius:8,background:"#00000012",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>
                               </div>
                               <input className="st-profile-input" style={{...inputStyle,background:"var(--bg)",flex:1}} value={profileTiktok} onChange={e=>setProfileTiktok(e.target.value)} placeholder="Username TikTok"/>
                             </div>
                          </div>
                        </div>

                        {/* Email (read-only) */}
                        <div style={{padding:"14px 16px",borderRadius:12,background:"var(--bg)",border:"1.5px solid var(--line)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                          <div style={{minWidth:0}}>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",fontWeight:600,margin:0,marginBottom:3,textTransform:"uppercase",letterSpacing:".06em"}}>Email</p>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".88rem",color:"var(--ink)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profileData?.email||session?.user?.email||"—"}</p>
                          </div>
                          {profileData?.emailVerified && (
                          <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(61,139,92,.1)",border:"1px solid rgba(61,139,92,.2)",flexShrink:0}}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3D8B5C" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                            <span style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"#3D8B5C",fontWeight:600}}>Terverifikasi</span>
                          </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Theme picker card */}
                    {(()=>{
                      const PROFILE_THEMES = [
                        {id:"cocoa",label:"Cokelat",bg:"#FAF6F0",accent:"#C4956A",soft:"#EBDACB",ink:"#2E2520",surface:"#FFFFFF",line:"#EDE7DF"},
                        {id:"sage",label:"Sage",bg:"#F2F6F2",accent:"#5A8A6A",soft:"#C8DFD0",ink:"#1E2E22",surface:"#FFFFFF",line:"#D8EAE0"},
                        {id:"rose",label:"Mawar",bg:"#FBF2F4",accent:"#C4607A",soft:"#F0CCDA",ink:"#2E1822",surface:"#FFFFFF",line:"#F0D8E0"},
                        {id:"ocean",label:"Lautan",bg:"#F0F5FA",accent:"#3D7FBF",soft:"#C8DDEF",ink:"#1A2A38",surface:"#FFFFFF",line:"#D0E4F2"},
                        {id:"lavender",label:"Lavender",bg:"#F4F2F8",accent:"#7A5A90",soft:"#D8CCEC",ink:"#22183A",surface:"#FFFFFF",line:"#E2D8F0"},
                        {id:"golden",label:"Emas",bg:"#FAF7F0",accent:"#B5902A",soft:"#EAD898",ink:"#2A2010",surface:"#FFFFFF",line:"#EDE4C0"},
                        {id:"slate",label:"Abu",bg:"#F4F5F6",accent:"#607080",soft:"#C8D4DC",ink:"#1A2228",surface:"#FFFFFF",line:"#D8E0E8"},
                        {id:"midnight",label:"Malam",bg:"#1A1820",accent:"#9A8FE0",soft:"#2A2840",ink:"#E8E6F8",surface:"#26243A",line:"#36344E"},
                      ];
                      return (
                        <div style={{borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",overflow:"hidden"}}>
                          <div style={{padding:"13px 18px",borderBottom:"1px solid var(--line)",background:"rgba(196,149,106,.03)",display:"flex",alignItems:"center",gap:8}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20"/><path d="M2 12h20"/></svg>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Tema Profil Publik</p>
                          </div>
                          <div style={{padding:"16px 18px"}}>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(70px,1fr))",gap:10}}>
                              {PROFILE_THEMES.map(t=>{
                                const isAct = profileTheme===t.id;
                                return (
                                  <button key={t.id} className="st-theme-btn" onClick={()=>setProfileTheme(t.id)}
                                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",padding:0}}>
                                    <div className="st-theme-swatch" style={{width:"100%",aspectRatio:"1",borderRadius:14,background:t.bg,border:`2.5px solid ${isAct?t.accent:"transparent"}`,boxShadow:isAct?`0 0 0 3px ${t.accent}30, 0 4px 12px rgba(0,0,0,.08)`:`0 0 0 1.5px ${t.line}`,position:"relative",overflow:"hidden",transition:"all .2s"}}>
                                      <div style={{position:"absolute",top:6,left:6,right:6,height:8,borderRadius:4,background:t.soft}}/>
                                      <div style={{position:"absolute",top:18,left:6,right:14,height:5,borderRadius:3,background:t.line}}/>
                                      <div style={{position:"absolute",top:27,left:6,right:10,height:5,borderRadius:3,background:t.line,opacity:.6}}/>
                                      <div style={{position:"absolute",bottom:5,right:5,width:16,height:16,borderRadius:"50%",background:t.accent}}/>
                                      {isAct && (
                                        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.accent}20`}}>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                                        </div>
                                      )}
                                    </div>
                                    <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:isAct?"var(--accent)":"var(--ink3)",fontWeight:isAct?600:400,lineHeight:1.2,textAlign:"center"}}>{t.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Catatan Dipin ke Profil ── */}
                    {(()=>{
                      const allNotes = Object.values(entries).filter((e:any) => !e.isLocked).sort((a:any,b:any) => b.ts - a.ts);
                      const pinned = allNotes.filter((e:any) => e.isProfilePinned);
                      const unpinned = allNotes.filter((e:any) => !e.isProfilePinned);
                      const pinnedCount = pinned.length;
                      const getTheme = (note:any) => note.theme ? NOTE_THEMES.find((t:any)=>t.id===note.theme) : null;
                      const getColor = (note:any) => note.color ? NOTE_COLORS.find((c:any)=>c.id===note.color) : null;
                      const pinNote = async (note:any) => {
                        if (pinnedCount >= 3) { setPinLimitToast(true); setTimeout(()=>setPinLimitToast(false),2500); return; }
                        let shareId = note.shareId;
                        if (!shareId) {
                          try {
                            const res = await fetch("/api/notes/share", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id: note.id, enable: true }) });
                            if (res.ok) { const d = await res.json(); shareId = d.shareId; }
                          } catch {}
                        }
                        const updated = { ...note, isProfilePinned: true, shareId, ts: Date.now() };
                        const next = { ...entriesRef.current, [note.id]: updated };
                        setEntries(next); lsFlush(next); syncCloud(next, updated, true);
                      };
                      const unpinNote = (note:any) => {
                        const updated = { ...note, isProfilePinned: false, ts: Date.now() };
                        const next = { ...entriesRef.current, [note.id]: updated };
                        setEntries(next); lsFlush(next); syncCloud(next, updated, true);
                      };
                      return (
                        <div style={{borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",overflow:"hidden",marginTop:16}}>
                          {/* Header */}
                          <div style={{padding:"11px 16px",borderBottom:"1px solid var(--line)",display:"flex",alignItems:"center",gap:8}}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Pin ke Profil</p>
                            <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:pinnedCount>=3?"#B5705A":"var(--accent)",background:pinnedCount>=3?"rgba(181,112,90,.1)":"var(--accent-soft)",borderRadius:20,padding:"1px 8px",fontWeight:600}}>{pinnedCount}/3</span>
                            <button onClick={()=>setShowPublicPicker(v=>!v)}
                              disabled={pinnedCount>=3&&!showPublicPicker}
                              style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:20,border:"1.5px solid var(--accent)",background:showPublicPicker?"var(--accent)":"transparent",cursor:"pointer",transition:"all .18s",opacity:pinnedCount>=3&&!showPublicPicker?.45:1}}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={showPublicPicker?"#fff":"var(--accent)"} strokeWidth="2.5" strokeLinecap="round"><path d={showPublicPicker?"M18 6L6 18M6 6l12 12":"M12 5v14M5 12h14"}/></svg>
                              <span style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:showPublicPicker?"#fff":"var(--accent)",fontWeight:600}}>{showPublicPicker?"Tutup":"Tambah"}</span>
                            </button>
                          </div>

                          {/* Pinned cards grid */}
                          <div style={{padding:"14px 14px",display:"flex",flexDirection:"column",gap:10}}>
                            {pinned.length === 0 && !showPublicPicker && (
                              <div style={{textAlign:"center",padding:"16px 0",color:"var(--ink3)"}}>
                                {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.4,marginBottom:6}}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> */}
                                <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",fontStyle:"italic",margin:0}}>Belum ada catatan yang dipin.</p>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",margin:"4px 0 0",opacity:.7}}>Klik <strong>Tambah</strong> untuk memilih.</p>
                              </div>
                            )}
                            {pinned.length > 0 && (
                              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                                {pinned.map((note:any)=>{
                                  const nt = getTheme(note);
                                  const nc = getColor(note);
                                  const isDk = nt?.dark;
                                  const cardBg = nt?.bg || nc?.bg || "var(--bg)";
                                  const cardAccent = nt?.accent || nc?.accent || "var(--accent)";
                                  const inkC = isDk ? "#E8F8F6" : nt||nc ? "#111" : "var(--ink)";
                                  const ink3C = isDk ? "rgba(168,228,222,.8)" : nt||nc ? "#444" : "var(--ink3)";
                                  return (
                                    <div key={note.id} style={{position:"relative",borderRadius:12,background:cardBg,border:`1.5px solid ${cardAccent}40`,padding:"11px 12px",overflow:"hidden"}}>
                                      {nt && <CardThemeBg themeId={nt.id} accent={nt.accent}/>}
                                      <div style={{position:"relative",zIndex:1}}>
                                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                                          <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:ink3C}}>{note.date}</span>
                                          {nt && <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",padding:"1px 5px",borderRadius:5,background:`${nt.accent}20`,color:nt.accent,border:`1px solid ${nt.accent}30`,fontWeight:500}}>{nt.emoji} {nt.label}</span>}
                                        </div>
                                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:".95rem",fontWeight:500,color:inkC,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{note.title||"Tanpa Judul"}</p>
                                        <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:ink3C,margin:"3px 0 0",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>{(note.text||"").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").trim()||"—"}</p>
                                      </div>
                                      {/* Unpin btn */}
                                      <button onClick={()=>unpinNote(note)} title="Lepas pin"
                                        style={{position:"absolute",top:7,right:7,zIndex:10,width:22,height:22,borderRadius:"50%",background:isDk?"rgba(0,0,0,.4)":"rgba(255,255,255,.85)",border:"1px solid rgba(0,0,0,.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={isDk?"#fff":"var(--ink2)"} strokeWidth="2.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Picker: unpinned public notes */}
                            {showPublicPicker && (
                              <div style={{borderTop: pinned.length>0 ? "1px solid var(--line)" : "none", paddingTop: pinned.length>0 ? 10 : 0}}>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Pilih catatan publik untuk dipin:</p>
                                {unpinned.length === 0 ? (
                                  <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",fontStyle:"italic"}}>Semua catatan publik sudah dipin.</p>
                                ) : (
                                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                    {unpinned.map((note:any)=>{
                                      const nt = getTheme(note);
                                      const nc = getColor(note);
                                      const cardBg = nt?.bg || nc?.bg || "var(--bg)";
                                      const cardAccent = nt?.accent || nc?.accent || "var(--ink3)";
                                      return (
                                        <button key={note.id} onClick={async ()=>{await pinNote(note);if(pinnedCount+1>=3)setShowPublicPicker(false);}}
                                          style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:11,border:`1.5px solid ${cardAccent}30`,background:cardBg,cursor:"pointer",textAlign:"left",width:"100%",transition:"all .18s",position:"relative",overflow:"hidden"}}>
                                          {nt && <CardThemeBg themeId={nt.id} accent={nt.accent}/>}
                                          <div style={{position:"relative",zIndex:1,flex:1,minWidth:0}}>
                                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                                              {nt && <span style={{fontSize:".75rem"}}>{nt.emoji}</span>}
                                              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:".9rem",fontWeight:500,color:nt?.dark?"#E8F8F6":nt||nc?"#111":"var(--ink)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{note.title||"Tanpa Judul"}</span>
                                            </div>
                                            <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:nt?.dark?"rgba(168,228,222,.8)":nt||nc?"#555":"var(--ink3)"}}>{note.date}</span>
                                          </div>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cardAccent} strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,opacity:.7,position:"relative",zIndex:1}}><path d="M12 5v14M5 12h14"/></svg>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Save button */}
                    <button style={{...btnPrimary,opacity:profileSaving?0.6:1}} disabled={profileSaving} onClick={saveProfile}>
                      {profileSaving
                        ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Menyimpan...</>
                        : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>Simpan Perubahan</>
                      }
                    </button>
                    <MsgBox msg={profileMsg}/>
                  </div>

                </div>
              </div>
                );
              }
            if (id === "display") return (
              <div>

                {/* ── Global App Theme ── */}
                <div style={{marginBottom:32}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:14,fontWeight:500,letterSpacing:".02em"}}>Tema Warna Aplikasi</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:10}}>
                    {([
                      { id:"default", label:"Cokelat Hangat", bg:"#FAF6F0", surface:"#FFFFFF", accent:"#C4956A", line:"#EDE7DF", ink:"#2E2520" },
                      { id:"sage",    label:"Sage Hijau",     bg:"#F2F7F4", surface:"#FFFFFF", accent:"#4A8A64", line:"#D0E4D8", ink:"#1E2E24" },
                      { id:"dark",    label:"One Dark",       bg:"#282C34", surface:"#21252B", accent:"#61AFEF", line:"#3E4451", ink:"#ABB2BF" },
                      { id:"ocean",   label:"Biru Laut",      bg:"#EDF6FF", surface:"#FFFFFF", accent:"#3D7FBF", line:"#B4CCE8", ink:"#1A2E42" },
                      { id:"violet",  label:"Malam Ungu",     bg:"#1A1525", surface:"#221D30", accent:"#A78BFA", line:"#362D4A", ink:"#E5E0F8" },
                    ] as const).map(t => {
                      const isAct = appTheme === t.id;
                      return (
                        <button key={t.id} onClick={()=>setAppTheme(t.id)}
                          style={{display:"flex",flexDirection:"column",gap:8,padding:"14px 12px",borderRadius:16,border:`2px solid ${isAct?t.accent:t.line}`,background:t.bg,cursor:"pointer",textAlign:"left",transition:"all .2s",position:"relative",overflow:"hidden",boxShadow:isAct?`0 0 0 1px ${t.accent}40,0 4px 16px ${t.accent}20`:"none"}}>
                          {/* Mini preview */}
                          <div style={{width:"100%",height:52,borderRadius:10,background:t.surface,border:`1px solid ${t.line}`,position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",top:8,left:8,right:8,height:5,borderRadius:3,background:t.line}}/>
                            <div style={{position:"absolute",top:17,left:8,right:16,height:4,borderRadius:3,background:t.line,opacity:.5}}/>
                            <div style={{position:"absolute",bottom:8,right:8,width:14,height:14,borderRadius:"50%",background:t.accent}}/>
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:t.ink,fontWeight:isAct?600:400}}>{t.label}</span>
                            {isAct && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{marginBottom:32}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:14,fontWeight:500,letterSpacing:".02em"}}>Font Default Catatan Baru</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
                    {NOTE_FONTS.map(f=>{
                      const isAct=defaultFont===f.id;
                      return (
                        <button key={f.id} onClick={()=>{setDefaultFont(f.id);localStorage.setItem("catatanku_def_font",f.id);}}
                          style={{display:"flex",flexDirection:"column",padding:"14px",borderRadius:16,border:`1.5px solid ${isAct?"var(--accent)":"var(--line)"}`,background:isAct?"var(--accent-soft)":"var(--surface)",cursor:"pointer",textAlign:"left",transition:"all .2s cubic-bezier(0.4,0,0.2,1)",boxShadow:isAct?"0 4px 12px rgba(196,149,106,0.1)":"none",position:"relative",overflow:"hidden"}}>
                          {isAct && <div style={{position:"absolute",top:0,right:0,width:24,height:24,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",borderBottomLeftRadius:10}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg></div>}
                          <div style={{marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${isAct?"rgba(196,149,106,.2)":"var(--line)"}`}}>
                            <span style={{fontFamily:f.family,fontSize:"2.4rem",color:isAct?"var(--accent)":"var(--ink)",lineHeight:1,display:"block"}}>Aa</span>
                          </div>
                          <div>
                            <p style={{fontFamily:f.family,fontSize:".82rem",color:isAct?"var(--accent)":"var(--ink)",fontWeight:isAct?600:500,margin:0}}>{f.label}</p>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",margin:0,marginTop:2}}>{f.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{marginBottom:32}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:14,fontWeight:500,letterSpacing:".02em"}}>Warna Default Catatan Baru</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(44px, 1fr))",gap:12,maxWidth:420}}>
                    {NOTE_COLORS.map(c=>(
                      <button key={c.id} title={c.label} onClick={()=>{setDefaultColor(c.id);localStorage.setItem("catatanku_def_color",c.id);}}
                        style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:0}}>
                        <div style={{width:44,height:44,borderRadius:"50%",background:c.bg||"#FAF6F0",border:`2px solid ${defaultColor===c.id?(c.accent||"var(--accent)"):"var(--line)"}`,boxShadow:defaultColor===c.id?`0 0 0 3px ${c.accent||"var(--accent)"}30`:"none",transition:"all .2s ease",transform:defaultColor===c.id?"scale(1.05)":"scale(1)"}}/>
                        <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:defaultColor===c.id?(c.accent||"var(--accent)"):"var(--ink3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%",textAlign:"center"}}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:16}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:14,fontWeight:500,letterSpacing:".02em"}}>Ukuran Teks Aplikasi</p>
                  <div style={{display:"flex",gap:10,background:"var(--line)",padding:4,borderRadius:14,width:"fit-content"}}>
                    {[{sz:0,lbl:"Kecil"},{sz:1,lbl:"Sedang"},{sz:2,lbl:"Besar"}].map(o=>(
                      <button key={o.sz} onClick={()=>{ const next=o.sz; setFontSize(next); localStorage.setItem("catatanku_fontsize",String(next)); }}
                        style={{padding:"8px 20px",borderRadius:10,border:"none",background:fontSize===o.sz?"var(--bg)":"transparent",boxShadow:fontSize===o.sz?"0 2px 8px rgba(0,0,0,0.06)":"none",color:fontSize===o.sz?"var(--accent)":"var(--ink3)",fontFamily:"'Lora',serif",fontSize:".84rem",fontWeight:fontSize===o.sz?600:400,cursor:"pointer",transition:"all .2s"}}>
                        {o.lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Teman Cerita ── */}
                <div style={{marginTop:32}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:14,fontWeight:500,letterSpacing:".02em"}}>Teman Cerita</p>
                  <div style={{borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",overflow:"hidden"}}>
                    <div style={{padding:"13px 18px",borderBottom:"1px solid var(--line)",background:"rgba(181,144,42,.03)",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:"1rem"}}>🐾</span>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Teman Cerita</p>
                      {companionType !== "none" && (
                        <span style={{marginLeft:"auto",fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--accent)",background:"var(--accent-light)",borderRadius:20,padding:"2px 9px",fontWeight:600}}>Aktif</span>
                      )}
                    </div>
                    <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:14}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                        {(() => {
                          const isAct = companionType === "none";
                          return (
                            <button key="none" onClick={()=>saveCompanion("none", "")}
                              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 6px",borderRadius:14,border:`2px solid ${isAct?"#B5902A":"var(--line)"}`,background:isAct?"rgba(181,144,42,.06)":"var(--bg)",cursor:"pointer",transition:"all .18s",opacity:.7}}>
                              <span style={{fontSize:"1.3rem",lineHeight:1}}>✕</span>
                              <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",fontWeight:600,color:isAct?"#B5902A":"var(--ink3)",lineHeight:1.2,textAlign:"center"}}>Tidak ada</span>
                            </button>
                          );
                        })()}
                        {COMPANIONS.filter(c => c.id !== "none").map(cp => {
                          const isAct = companionType === cp.id;
                          return (
                            <button key={cp.id} onClick={()=>saveCompanion(cp.id, companionName || cp.defName)}
                              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 6px",borderRadius:14,border:`2px solid ${isAct?cp.color:`${cp.color}30`}`,background:isAct?`${cp.color}12`:"var(--bg)",cursor:"pointer",transition:"all .18s",position:"relative"}}>
                              {isAct && <div style={{position:"absolute",top:5,right:5,width:7,height:7,borderRadius:"50%",background:cp.color}}/>}
                              <span style={{fontSize:"1.4rem",lineHeight:1}}>{cp.icon}</span>
                              <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",fontWeight:600,color:isAct?cp.color:"var(--ink3)",lineHeight:1.2,textAlign:"center"}}>{cp.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {companionType !== "none" && (() => {
                        const cp = COMPANIONS.find(c => c.id === companionType);
                        if (!cp) return null;
                        const preview = COMPANION_MSGS[companionType]?.home[0] ?? "";
                        return (
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{background:`${cp.color}0D`,border:`1px solid ${cp.color}30`,borderRadius:12,padding:"9px 12px",display:"flex",gap:8,alignItems:"flex-start"}}>
                              <span style={{fontSize:"1.1rem",lineHeight:1,flexShrink:0}}>{cp.icon}</span>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink)",margin:0,lineHeight:1.45,fontStyle:"italic"}}>&ldquo;{preview}&rdquo;</p>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:".65rem",color:cp.color,fontFamily:"'Lora',serif",fontWeight:600,background:`${cp.color}15`,borderRadius:20,padding:"2px 10px"}}>{cp.desc}</span>
                            </div>
                            <div>
                              <label style={{display:"block",fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",marginBottom:6,fontWeight:500}}>
                                Nama panggilan <span style={{color:"var(--ink3)",fontWeight:400}}>(opsional, default: {cp.defName})</span>
                              </label>
                              <div style={{display:"flex",gap:8}}>
                                <input style={{...inputStyle,background:"var(--bg)",flex:1,borderColor:`${cp.color}40`}} value={companionName} onChange={e=>setCompanionName(e.target.value)} placeholder={cp.defName} maxLength={20}/>
                                <button onClick={()=>saveCompanion(companionType, companionName)} style={{...btnPrimary,width:"auto",padding:"0 16px",height:42,fontSize:".78rem",background:cp.color,borderColor:cp.color}} disabled={companionSaving}>
                                  {companionSaving ? "..." : "Simpan"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
            if (id === "notif") return (
              <div>

                {/* Permission status banner */}
                {notifStatus==="denied" && (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:14,background:"rgba(181,112,90,.08)",border:"1px solid rgba(181,112,90,.2)",marginBottom:20}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
                    <div style={{flex:1}}>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"#B5705A",fontWeight:500,margin:0}}>Notifikasi diblokir</p>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"#B5705A",opacity:.8,margin:0,marginTop:2}}>Aktifkan di pengaturan browser → Site Settings → Notifications.</p>
                    </div>
                  </div>
                )}

                {/* Main toggles card */}
                <div style={{borderRadius:18,border:"1px solid var(--line)",overflow:"hidden",background:"var(--surface)",marginBottom:20}}>
                  {/* Toggle row: Pengingat Harian */}
                  {(() => {
                    const canToggle = notifStatus==="granted";
                    const isOn = canToggle && notifEnabled;
                    const toggle = () => {
                      if (!canToggle) return;
                      const next = !notifEnabled;
                      setNotifEnabled(next);
                      localStorage.setItem("catatanku_notif_enabled", next?"1":"0");
                    };
                    return (
                      <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderBottom:"1px solid var(--line)"}}>
                        <div style={{width:40,height:40,borderRadius:12,background:"rgba(61,139,92,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D8B5C" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                        </div>
                        <div style={{flex:1}}>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink)",fontWeight:500,margin:0}}>Pengingat Harian</p>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink3)",margin:0,marginTop:2}}>Diingatkan untuk menulis setiap hari</p>
                        </div>
                        <button onClick={toggle} style={{flexShrink:0,width:48,height:28,borderRadius:14,border:"none",cursor:canToggle?"pointer":"not-allowed",padding:3,background:isOn?"var(--accent)":"var(--line)",transition:"background .2s",position:"relative",opacity:canToggle?1:.5}}>
                          <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.15)",transition:"transform .2s",transform:isOn?"translateX(20px)":"translateX(0)"}}/>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Toggle row: Streak Reminder */}
                  {(()=>{
                    const canToggle = notifStatus==="granted";
                    const isOn = canToggle && notifEnabled && notifStreakEnabled;
                    return (
                      <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px"}}>
                        <div style={{width:40,height:40,borderRadius:12,background:"rgba(196,149,60,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B5902A" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        </div>
                        <div style={{flex:1}}>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink)",fontWeight:500,margin:0}}>Streak Harian</p>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink3)",margin:0,marginTop:2}}>Notifikasi saat streak hampir putus</p>
                        </div>
                        <button onClick={()=>{if(!canToggle||!notifEnabled)return;const next=!notifStreakEnabled;setNotifStreakEnabled(next);localStorage.setItem("catatanku_notif_streak",next?"1":"0");}} style={{flexShrink:0,width:48,height:28,borderRadius:14,border:"none",cursor:canToggle&&notifEnabled?"pointer":"not-allowed",padding:3,background:isOn?"var(--accent)":"var(--line)",transition:"background .2s",position:"relative",opacity:canToggle&&notifEnabled?1:.5}}>
                          <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.15)",transition:"transform .2s",transform:isOn?"translateX(20px)":"translateX(0)"}}/>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Enable button (if not yet granted) */}
                {notifStatus!=="granted" && notifStatus!=="denied" && (
                  <button style={btnPrimary} onClick={()=>{import("@/lib/firebase-client").then(({requestNotificationToken})=>{requestNotificationToken().then(token=>{if(!token)return;fetch("/api/notifications/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).catch(()=>{});localStorage.setItem("catatanku_notif_asked","1");});});}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                    Aktifkan Notifikasi
                  </button>
                )}
              </div>
            );
            if (id === "security") return (
              <div>
                <style>{`
                  .st-sec-card{border-radius:18px;border:1.5px solid var(--line);background:var(--surface);overflow:hidden;margin-bottom:24px;transition:all .25s ease}
                  .st-sec-card:hover{border-color:var(--accent-soft);box-shadow:0 4px 20px rgba(0,0,0,0.04)}
                  .st-sec-header{padding:13px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px}
                `}</style>

                {/* ── Akun Privat ── */}
                <div className="st-sec-card">
                  <div className="st-sec-header" style={{background:"rgba(122,90,144,0.04)"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A5A90" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Privasi Akun</p>
                    {profileSaving && id === "security" && (
                      <span style={{marginLeft:"auto",fontFamily:"'Lora',serif",fontSize:".62rem",color:"#7A5A90",fontWeight:600}} className="pulse">Menyimpan...</span>
                    )}
                  </div>
                  <div style={{padding:"16px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".88rem",color:"var(--ink)",margin:"0 0 3px",fontWeight:600}}>Akun Privat</p>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink3)",margin:0,lineHeight:1.45}}>Saat aktif, profilmu tidak bisa diakses oleh orang lain. Pengunjung akan melihat pesan bahwa akun ini privat.</p>
                      </div>
                      <button onClick={async ()=>{
                        const next = !profileIsPrivate;
                        setProfileIsPrivate(next);
                        // Save immediately for better UX in security tab
                        try {
                          await fetch("/api/user/profile", {
                            method: "PATCH",
                            headers: {"Content-Type":"application/json"},
                            body: JSON.stringify({ isPrivate: next }),
                          });
                          setProfileData((p: any) => ({...p, isPrivate: next}));
                        } catch {}
                      }}
                        style={{flexShrink:0,width:46,height:26,borderRadius:13,background:profileIsPrivate?"#7A5A90":"var(--line)",border:"none",cursor:"pointer",position:"relative",transition:"background .25s ease",padding:0,boxShadow:profileIsPrivate?"0 2px 8px rgba(122,90,144,0.3)":"none"}}>
                        <div style={{position:"absolute",top:3,left:profileIsPrivate?23:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.15)",transition:"left .25s cubic-bezier(0.23,1,0.32,1)"}}/>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Peta Catatan ── */}
                <div style={{borderRadius:18,border:"1.5px solid var(--line)",background:"var(--surface)",overflow:"hidden",marginBottom:28}}>
                  <div style={{padding:"13px 18px",borderBottom:"1px solid var(--line)",background:"rgba(90,158,106,.04)",display:"flex",alignItems:"center",gap:8}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A9E6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink2)",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600,margin:0}}>Peta Catatan</p>
                  </div>
                  <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:"var(--ink)",margin:"0 0 3px",fontWeight:500}}>Simpan lokasi catatan</p>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",margin:0,lineHeight:1.4}}>Koordinat GPS disimpan saat kamu mulai menulis. Lokasi hanya terlihat olehmu.</p>
                      </div>
                      <button onClick={()=>{ const next=!locationEnabled; setLocationEnabled(next); localStorage.setItem("catatanku_location_enabled",next?"1":"0"); }}
                        style={{flexShrink:0,width:44,height:26,borderRadius:13,background:locationEnabled?"#5A9E6A":"var(--line)",border:"none",cursor:"pointer",position:"relative",transition:"background .22s",padding:0}}>
                        <div style={{position:"absolute",top:3,left:locationEnabled?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.18)",transition:"left .22s"}}/>
                      </button>
                    </div>
                    {locationEnabled && (
                      <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(90,158,106,.07)",borderRadius:10,padding:"8px 12px"}}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#5A9E6A" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"#5A9E6A",margin:0,fontWeight:500}}>Aktif — lokasi akan diambil saat kamu membuka catatan baru</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink2)",marginBottom:6}}>Kata Sandi Lama</label>
                  <input style={inputStyle} type="password" value={pwCurrent} onChange={e=>setPwCurrent(e.target.value)} placeholder="••••••••"/>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink2)",marginBottom:6}}>Kata Sandi Baru</label>
                  <input style={inputStyle} type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} placeholder="••••••••"/>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:"block",fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink2)",marginBottom:6}}>Konfirmasi Kata Sandi Baru</label>
                  <input style={inputStyle} type="password" value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} placeholder="••••••••" onKeyDown={e=>{if(e.key==="Enter")savePassword();}}/>
                </div>
                <button style={{...btnPrimary,opacity:pwSaving?0.6:1}} disabled={pwSaving} onClick={savePassword}>{pwSaving?"Menyimpan...":"Ubah Kata Sandi"}</button>
                <MsgBox msg={pwMsg}/>
                <div style={{marginTop:36,paddingTop:28,borderTop:"1px solid var(--line)"}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",fontWeight:500,marginBottom:8}}>Catatan Terkunci</p>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",lineHeight:1.6,marginBottom:0}}>Catatan yang dikunci menggunakan kata sandi akun yang sama. Mengubah kata sandi di atas akan otomatis memperbarui kunci semua catatan.</p>
                </div>
              </div>
            );
            if (id === "stats") return (()=>{
              const totalWords=allSorted.reduce((acc:number,e:any)=>{const t=((e.title||"")+" "+stripHtml(e.text||"")).trim();return acc+(t?t.split(/\s+/).filter(Boolean).length:0);},0);
              const moodTally:Record<number,number>={};
              allSorted.forEach((e:any)=>{if(e.mood!=null)moodTally[e.mood]=(moodTally[e.mood]||0)+1;});
              const sortedMoods=Object.entries(moodTally).sort((a,b)=>(b[1] as number)-(a[1] as number));
              const monthAgo=new Date();monthAgo.setDate(monthAgo.getDate()-30);
              const last30=allSorted.filter((e:any)=>new Date(e.date+"T00:00:00")>=monthAgo).length;
              const lockedCount=allSorted.filter((e:any)=>e.isLocked).length;
              const pinnedCount=allSorted.filter((e:any)=>e.isPinned).length;
              return (
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:32}}>
                    {[
                      {val:total,lbl:"Total Catatan",icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"},
                      {val:`${totalWords.toLocaleString("id")}`,lbl:"Total Kata",icon:"M4 6h16M4 12h16M4 18h7"},
                      {val:last30,lbl:"30 Hari Terakhir",icon:"M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7zM3 10h18"},
                      {val:streak?.currentStreak||0,lbl:"Streak Sekarang",icon:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"},
                      {val:profileData?.longestStreak||streak?.longestStreak||0,lbl:"Streak Terpanjang",icon:"M18 20V10M12 20V4M6 20v-6"},
                      {val:lockedCount,lbl:"Catatan Terkunci",icon:IC.lock},
                      {val:pinnedCount,lbl:"Catatan Disematkan",icon:IC.pin},
                    ].map((s,i)=>(
                      <div key={i} style={{padding:"18px 20px",borderRadius:16,border:"1px solid var(--line)",background:"var(--surface)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
                        </div>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2rem",fontWeight:300,color:"var(--ink)",margin:0,lineHeight:1}}>{s.val}</p>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",margin:0,marginTop:4}}>{s.lbl}</p>
                      </div>
                    ))}
                  </div>
                  {sortedMoods.length>0 && (
                    <div>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:16,fontWeight:500}}>Distribusi Suasana Hati</p>
                      <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:480}}>
                        {sortedMoods.slice(0,8).map(([idx,cnt])=>{
                          const m=MOODS[parseInt(idx)];
                          const pct=Math.round((cnt as number)/allSorted.length*100);
                          return (
                            <div key={idx} style={{display:"flex",alignItems:"center",gap:12}}>
                              <span style={{fontSize:"1.1rem",flexShrink:0}}>{m.emoji}</span>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                                  <span style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink)"}}>{m.label}</span>
                                  <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{cnt as number}x · {pct}%</span>
                                </div>
                                <div style={{height:6,borderRadius:4,background:"var(--line)",overflow:"hidden"}}>
                                  <div style={{height:"100%",borderRadius:4,background:m.color,width:`${pct}%`,transition:"width .5s ease"}}/>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {keywordAnalysis.length > 0 && (
                    <div style={{marginTop:36}}>
                      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:16}}>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",fontWeight:500,margin:0,whiteSpace:"nowrap"}}>Wawasan Kata (Kata Kunci)</p>
                        <div style={{flex:1,height:1,background:"var(--line)",opacity:.5}}/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
                        {keywordAnalysis.map((ka, i) => (
                          <div key={ka.word} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:12,background:"var(--surface)",border:"1px solid var(--line)",transition:"all .2s ease"}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent-soft)"; e.currentTarget.style.transform="translateY(-2px)";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--line)"; e.currentTarget.style.transform="translateY(0)";}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{fontSize:".7rem",color:"var(--ink3)",fontFamily:"'Lora',serif",width:14}}>{i+1}.</span>
                              <span style={{fontFamily:"'Lora',serif",fontSize:".86rem",color:"var(--ink)",fontWeight:500,textTransform:"capitalize"}}>{ka.word}</span>
                            </div>
                            <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--accent)",background:"var(--accent-soft)",padding:"3px 10px",borderRadius:8,fontWeight:600}}>{ka.count}×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })();
            if (id === "data") return (
              <div>
                <p style={{fontFamily:"'Lora',serif",fontSize:".84rem",color:"var(--ink3)",marginBottom:20,lineHeight:1.6}}>Kelola arsip catatan dan hapus data personal.</p>
                <div style={{padding:"20px 22px",borderRadius:16,border:"1px solid var(--line)",background:"var(--surface)",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(61,127,191,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D7FBF" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </div>
                    <div>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink)",fontWeight:500,margin:0}}>Ekspor Semua Catatan</p>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",margin:0,marginTop:3,lineHeight:1.5}}>Unduh semua {total} catatan kamu sebagai file JSON. Termasuk isi, mood, label, dan metadata.</p>
                    </div>
                  </div>
                  <button style={{...btnSecondary}} onClick={()=>{setExportPwModal(true);setExportPw("");setExportPwError("");}}>⬇ Unduh JSON</button>
                </div>
                <div style={{padding:"20px 22px",borderRadius:16,border:"1px solid var(--line)",background:"var(--surface)",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(50,160,150,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#32A096" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v12M7 8l5-5 5 5M4 21h16"/></svg>
                    </div>
                    <div>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink)",fontWeight:500,margin:0}}>Impor Catatan (JSON)</p>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",margin:0,marginTop:3,lineHeight:1.5}}>Tambah catatan dari file JSON hasil ekspor. Data kamu akan ditambahkan tanpa menghapus catatan yang sudah ada.</p>
                    </div>
                  </div>
                  <button style={{...btnSecondary}} onClick={handleImportClick}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v12M7 8l5-5 5 5"/></svg>
                    Impor JSON
                  </button>
                  <input type="file" ref={importFileRef} style={{display:"none"}} accept=".json" multiple onChange={onImportFileChange}/>
                </div>
                <div style={{padding:"20px 22px",borderRadius:16,border:`1px solid ${isDarkApp?"rgba(181,112,90,.5)":"rgba(181,112,90,.3)"}`,background:isDarkApp?"rgba(181,112,90,.1)":"rgba(254,245,241,.6)"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(181,112,90,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="1.8" strokeLinecap="round"><path d={IC.trash}/></svg>
                    </div>
                    <div>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink)",fontWeight:500,margin:0}}>Hapus Semua Catatan</p>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink2)",margin:0,marginTop:3,lineHeight:1.5}}>Hapus permanen semua {total} catatan. Akun kamu tetap ada. Tindakan ini tidak bisa dibatalkan.</p>
                    </div>
                  </div>
                  <button style={{...btnDanger,fontSize:".84rem",padding:"9px 18px"}} onClick={()=>{setDeleteAllModal(true);setDeleteAllPw("");setDeleteAllError("");}}>Hapus Semua Catatan</button>
                </div>
              </div>
            );
            if (id === "account") return (
              <div>
                <div style={{padding:"18px 20px",borderRadius:16,border:"1px solid var(--line)",background:"var(--surface)",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"var(--accent-soft)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {profileImage ? <img src={profileImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",color:"var(--accent)",fontWeight:300}}>{(profileData?.name||session?.user?.name||"?")[0]?.toUpperCase()}</span>}
                    </div>
                    <div>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink)",fontWeight:500,margin:0}}>{profileData?.name||session?.user?.name||"—"}</p>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",margin:0,marginTop:2}}>{profileData?.email||session?.user?.email||""}</p>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <div style={{padding:"5px 12px",borderRadius:20,background:"var(--accent-soft)",border:"1px solid var(--accent-soft)",fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--accent)"}}>{total} catatan</div>
                    <div style={{padding:"5px 12px",borderRadius:20,background:"var(--accent-soft)",border:"1px solid var(--accent-soft)",fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--accent)"}}>🔥 {streak?.currentStreak||0} hari streak</div>
                  </div>
                </div>
                <button style={{...btnSecondary,width:"100%",justifyContent:"center",display:"flex",alignItems:"center",gap:8,marginBottom:28}} onClick={()=>setShowLogout(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={IC.x}/></svg>
                  Logout
                </button>
                <div style={{padding:"20px 22px",borderRadius:16,border:"1px solid rgba(181,112,90,.3)",background:"rgba(254,245,241,.6)"}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"#B5705A",fontWeight:600,margin:0,marginBottom:6}}>Hapus Akun</p>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",margin:0,marginBottom:16,lineHeight:1.6}}>Hapus akun secara permanen beserta seluruh catatan dan data. Tindakan ini tidak dapat dibatalkan.</p>
                  <button style={{...btnDanger,fontSize:".84rem",padding:"9px 18px"}} onClick={()=>{setDeleteAccModal(true);setDeleteAccPw("");setDeleteAccError("");}}>Hapus Akun Permanen</button>
                </div>
              </div>
            );
            return null;
          };

          const MOB_GROUPS = [
            { label:"Akun & Profil", tabs: STABS.slice(0,1) },
            { label:"Aplikasi",      tabs: STABS.slice(1,4) },
            { label:"Lainnya",       tabs: STABS.slice(4) },
          ];

          return (
            <div style={{animation:"pgIn .35s cubic-bezier(.23,1,.32,1) both"}}>
              <style>{`
                .st-nav-btn{display:flex;align-items:center;gap:12px;padding:10px 12px;border:none;background:transparent;cursor:pointer;width:100%;text-align:left;transition:all .18s;border-radius:10px}
                .st-nav-btn:hover{background:var(--accent-soft)}
                .st-nav-btn.active{background:var(--accent-soft)}
                .st-mob-row{display:flex;align-items:center;gap:14px;padding:16px 18px;border:none;background:transparent;cursor:pointer;width:100%;text-align:left;transition:background .15s}
                .st-mob-row:hover{background:rgba(196,149,106,.06)}
                @media(max-width:767px) { .st-shell-mob { padding-top: 0px !important; margin-top: -36px !important; } }
                @media(min-width:768px) { .st-shell-mob { padding-top: 62px !important; } }
                @keyframes stTabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                @keyframes stMobIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
              `}</style>

              {/* ══════ MOBILE ══════ */}
              <div className="mob-only" style={{flexDirection:"column",paddingBottom:120}}>
                {settingsMobileView === "menu" ? (
                  <div key="st-menu" style={{animation:"stMobIn .28s cubic-bezier(.23,1,.32,1) both",display:"flex",flexDirection:"column",gap:16}}>

                    {/* ── Identity card ── */}
                    <div style={{borderRadius:24,overflow:"hidden",background:"var(--surface)",border:"1px solid var(--line)",boxShadow:"0 4px 20px rgba(196,149,106,.08)"}}>
                      {/* Slim accent bar */}
                      <div style={{height:6,background:"linear-gradient(90deg,var(--accent),rgba(196,149,106,.3))"}}/>
                      <div style={{padding:"20px 18px 18px"}}>
                        {/* Row: avatar + info */}
                        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
                          <div style={{position:"relative",flexShrink:0}}>
                            <div style={{width:72,height:72,borderRadius:"50%",overflow:"hidden",background:"var(--accent-soft)",border:"2.5px solid var(--line)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              {profileImage
                                ? <img src={profileImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                : <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2rem",color:"var(--accent)",fontWeight:400,lineHeight:1}}>{(profileData?.name||session?.user?.name||"?")[0]?.toUpperCase()}</span>
                              }
                            </div>
                            {/* online dot */}
                            <div style={{position:"absolute",bottom:3,right:3,width:12,height:12,borderRadius:"50%",background:"#4CAF50",border:"2px solid var(--surface)"}}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.45rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1.1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profileData?.name||session?.user?.name||"Pengguna"}</p>
                            {profileData?.username&&<p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--accent)",margin:"3px 0 0",fontWeight:600}}>@{profileData.username}</p>}
                            <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",margin:"2px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profileData?.email||session?.user?.email||""}</p>
                          </div>
                          {/* Edit shortcut */}
                          <button onClick={()=>setSettingsMobileView("profile")} style={{flexShrink:0,width:36,height:36,borderRadius:12,background:"var(--accent-soft)",border:"1px solid rgba(196,149,106,.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </div>
                        {/* Stats row */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          {[{v:allSorted.length,l:"Catatan",icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",c:"var(--accent)"},{v:streak?.currentStreak||0,l:"Streak",icon:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",c:"#B5902A"},{v:streak?.longestStreak||0,l:"Terpanjang",icon:"M18 20V10M12 20V4M6 20v-6",c:"#3D8B5C"}].map((s,i)=>(
                            <div key={i} style={{textAlign:"center",padding:"10px 6px",borderRadius:14,background:"var(--bg)",border:"1px solid var(--line)"}}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",margin:"0 auto 4px"}}><path d={s.icon}/></svg>
                              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:500,color:s.c,margin:0,lineHeight:1}}>{s.v}</p>
                              <p style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:"var(--ink3)",margin:0,marginTop:2}}>{s.l}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── Settings groups ── */}
                    {MOB_GROUPS.map(g=>(
                      <div key={g.label}>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:700,marginBottom:10,marginTop:18,paddingLeft:14}}>{g.label}</p>
                        <div style={{borderRadius:18,border:"1px solid var(--line)",overflow:"hidden",background:"var(--surface)",boxShadow:"0 2px 8px rgba(0,0,0,.03)"}}>
                          {g.tabs.map((t,i)=>(
                            <button key={t.id} onClick={()=>setSettingsMobileView(t.id)} className="st-mob-row"
                              style={{borderBottom:i<g.tabs.length-1?"1px solid var(--line)":"none"}}>
                              <div style={{width:38,height:38,borderRadius:11,background:t.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon}/></svg>
                              </div>
                              <span style={{fontFamily:"'Lora',serif",fontSize:".92rem",color:"var(--ink)",flex:1,fontWeight:500}}>{t.label}</span>
                              <div style={{width:6,height:6,borderRadius:"50%",background:"var(--line)",flexShrink:0}}/>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div key={settingsMobileView} style={{animation:"stMobIn .28s cubic-bezier(.23,1,.32,1) both"}}>
                    {/* Sub-page header */}
                    {(()=>{const tab=STABS.find(s=>s.id===settingsMobileView)!;return(
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"16px 20px 14px",borderBottom:"1px solid var(--line)",marginBottom:20,position:"relative"}}>
                        <button onClick={()=>setSettingsMobileView("menu")}
                          style={{width:36,height:36,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"flex-start",color:"var(--ink2)",flexShrink:0,border:"none",marginLeft:"-6px"}}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        </button>
                        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1.1}}>{tab.label}</h2>
                      </div>
                    );})()}
                    <div style={{padding:"0 20px 24px"}}>
                      {renderSection(settingsMobileView)}
                    </div>
                  </div>
                )}
              </div>

              {/* ══════ DESKTOP ══════ */}
              <div className="desk-only" style={{flexDirection:"column", marginTop: -70}}>
                <div style={{display:"flex",gap:64,alignItems:"flex-start",width:"100%",margin:"0 auto",padding:"0 16px"}}>

                  {/* ── Sidebar ── */}
                  <div style={{width:300,flexShrink:0,position:"sticky",top:94}}>
                    {/* Profile card */}
                    <div style={{borderRadius:20,overflow:"hidden",marginBottom:12,background:"var(--surface)",border:"1px solid var(--line)",boxShadow:"var(--shadow)"}}>
                      <div style={{padding:"22px 16px 18px",background:"linear-gradient(145deg,var(--accent-soft) 0%,var(--surface) 100%)",textAlign:"center",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:"var(--accent-soft)",opacity:.45,pointerEvents:"none"}}/>
                        <div style={{width:68,height:68,borderRadius:"50%",overflow:"hidden",border:"3px solid var(--surface)",boxShadow:"0 6px 20px rgba(196,149,106,.25)",background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",position:"relative"}}>
                          {profileImage?<img src={profileImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2rem",color:"var(--accent)",fontWeight:400,lineHeight:1}}>{(profileData?.name||session?.user?.name||"?")[0]?.toUpperCase()}</span>}
                        </div>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1.2}}>{profileData?.name||session?.user?.name||"Pengguna"}</p>
                        {profileData?.username&&<p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--accent)",margin:"4px 0 0",fontWeight:500}}>@{profileData.username}</p>}
                        <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",margin:"3px 0 0",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 8px"}}>{profileData?.email||session?.user?.email||""}</p>
                      </div>
                      {/* mini stats */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderTop:"1px solid var(--line)"}}>
                        {[{v:allSorted.length,l:"catatan"},{v:streak?.currentStreak||0,l:"streak"},{v:streak?.longestStreak||0,l:"max"}].map((s,i)=>(
                          <div key={i} style={{padding:"12px 0",textAlign:"center",borderRight:i<2?"1px solid var(--line)":"none"}}>
                            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontWeight:500,color:"var(--accent)",margin:0,lineHeight:1}}>{s.v}</p>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:"var(--ink3)",margin:0,marginTop:2}}>{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nav */}
                    <div style={{borderRadius:18,background:"var(--surface)",border:"1px solid var(--line)",padding:"6px",boxShadow:"var(--shadow)",display:"flex",flexDirection:"column",gap:2}}>
                      {STABS.map((t)=>{
                        const isAct=settingsTab===t.id;
                        return (
                          <button key={t.id} onClick={()=>setSettingsTab(t.id)} className={`st-nav-btn ${isAct?"active":""}`}>
                            <div style={{width:34,height:34,borderRadius:10,background:isAct?"var(--accent)":t.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isAct?"#fff":t.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon}/></svg>
                            </div>
                            <span style={{fontFamily:"'Lora',serif",fontSize:".86rem",color:isAct?"var(--accent)":"var(--ink)",fontWeight:isAct?600:400,flex:1}}>{t.label}</span>
                            {isAct&&<div style={{width:5,height:5,borderRadius:"50%",background:"var(--accent)",flexShrink:0}}/>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Content ── */}
                  <div style={{flex:1,minWidth:0}}>
                    <div key={settingsTab} style={{animation:"stTabIn .3s cubic-bezier(.23,1,.32,1) both",background:"var(--surface)",borderRadius:20,border:"1px solid var(--line)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
                      {/* Card header */}
                      {(()=>{const tab=STABS.find(s=>s.id===settingsTab)!;return(
                        <div style={{display:"flex",alignItems:"center",gap:16,padding:"20px 32px 18px",borderBottom:"1px solid var(--line)",background:"linear-gradient(90deg,var(--accent-soft) 0%,transparent 65%)",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",right:-20,top:-20,width:90,height:90,borderRadius:"50%",background:"var(--accent-soft)",opacity:.5,pointerEvents:"none"}}/>
                          <div style={{width:42,height:42,borderRadius:13,background:tab.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={tab.stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon}/></svg>
                          </div>
                          <div style={{position:"relative"}}>
                            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.75rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1}}>{tab.label}</h1>
                            <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink3)",margin:"4px 0 0"}}>Personalisasi buku harianmu</p>
                          </div>
                        </div>
                      );})()}
                      {/* Section content */}
                      <div style={{padding:"28px 32px"}}>
                        {renderSection(settingsTab)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

        {/* ── Delete All Notes Modal ── */}
        {/* ── Export Password Modal ── */}
        {exportPwModal && (
          <div className="modal-bg" style={{animation:"modalBgIn .18s ease both"}} onClick={e=>{if(e.target===e.currentTarget){setExportPwModal(false);}}}>
            <div className="modal" style={{textAlign:"left"}}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:500,color:"var(--ink)",marginBottom:8}}>Ekspor Catatan</h3>
              <p style={{fontFamily:"'Lora',serif",fontSize:".84rem",color:"var(--ink2)",lineHeight:1.6,marginBottom:18}}>Masukkan kata sandi untuk melanjutkan ekspor data.</p>
              <input style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".88rem",outline:"none",boxSizing:"border-box" as any,marginBottom:8}} type="password" placeholder="Kata sandi" value={exportPw} onChange={e=>{setExportPw(e.target.value);setExportPwError("");}} onKeyDown={e=>{if(e.key==="Enter")doExport();}} autoFocus/>
              {exportPwError && <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"#B5705A",marginBottom:8}}>{exportPwError}</p>}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
                <div style={{display:"flex",gap:8}}>
                  <button style={{flex:1,padding:"11px",borderRadius:11,border:"1px solid var(--line)",background:"var(--surface)",color:"var(--ink2)",fontFamily:"'Lora',serif",fontSize:".86rem",cursor:"pointer"}} onClick={()=>setExportPwModal(false)}>Batal</button>
                  <button style={{flex:1,padding:"11px",borderRadius:11,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".86rem",fontWeight:500,cursor:"pointer",opacity:exportLoading?.6:1}} disabled={exportLoading} onClick={()=>doExport()}>Ekspor Semua</button>
                </div>
                <button 
                  style={{width:"100%",padding:"11px",borderRadius:11,border:"1.5px solid var(--accent)",background:"transparent",color:"var(--accent)",fontFamily:"'Lora',serif",fontSize:".86rem",fontWeight:600,cursor:"pointer"}} 
                  onClick={async () => {
                    // Verify first
                    const verify = await fetch("/api/auth/verify-password", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ password: exportPw }) });
                    const vd = await verify.json();
                    if (!vd.verified) { setExportPwError("Kata sandi salah."); return; }
                    
                    const allNotes = Object.values(entries).sort((a: any, b: any) => b.ts - a.ts).map((n: any) => ({
                      ...n,
                      _preview: getPreviewText(n.text || "")
                    }));
                    setExportData(allNotes);
                    setSelectedExportIndices(new Set(allNotes.map((_, i) => i)));
                    setExportConfirmModal(true);
                  }}
                >
                  Pilih Catatan untuk Ekspor
                </button>
              </div>
            </div>
          </div>
        )}

        {importConfirmModal && (
          <div className="modal-bg" style={{animation:"modalBgIn .18s ease both"}} onClick={e=>{if(e.target===e.currentTarget)setImportConfirmModal(false)}}>
            <div className="modal" style={{textAlign:"left", maxWidth: 440, padding: "28px 28px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:12}}>
                <div style={{flex:1}}>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1.1}}>Pratinjau Impor</h3>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",lineHeight:1.5,marginTop:6,marginBottom:0}}>
                    Ditemukan <strong>{importData.length} catatan</strong>. Pilih mana yang ingin kamu simpan.
                  </p>
                  {importOwner && (
                    <div style={{position:"relative"}}>
                      <div 
                        onClick={() => setShowOwnerList(!showOwnerList)}
                        style={{
                          display:"flex",alignItems:"center",gap:8,marginTop:10,padding:"6px 12px",
                          background:"var(--accent-soft)",borderRadius:12,width:"fit-content",
                          cursor:"pointer", transition:"all .15s", border:"1px solid transparent"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor="var(--accent)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor="transparent"}
                      >
                        <div style={{width:20,height:20,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".65rem",fontWeight:700}}>{importOwner.name[0].toUpperCase()}</div>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--accent)",margin:0,fontWeight:600}}>Milik: {importOwner.name} <span style={{opacity:.6,fontWeight:400}}>({importOwner.email})</span></p>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{transform:showOwnerList?"rotate(180deg)":"rotate(0)", transition:"transform .2s"}}><polyline points="6 9 12 15 18 9"/></svg>
                      </div>

                      {showOwnerList && importAllOwners.length > 1 && (
                        <div style={{
                          position:"absolute", top:"100%", left:0, zIndex:100, marginTop:6,
                          background:"var(--surface)", border:"1px solid var(--line)", borderRadius:12,
                          boxShadow:"0 8px 24px rgba(0,0,0,.12)", padding:8, minWidth:240,
                          animation:"stMobIn .2s ease"
                        }}>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",margin:"4px 8px 8px",fontWeight:600,textTransform:"uppercase"}}>Daftar Pengarang ({importAllOwners.length})</p>
                          <div style={{display:"flex",flexDirection:"column",gap:2}}>
                            {importAllOwners.map((o, idx) => (
                              <div key={idx} style={{padding:"8px 10px", borderRadius:8, display:"flex", alignItems:"center", gap:10, background:"var(--bg)"}}>
                                <div style={{width:18,height:18,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:".6rem",fontWeight:700}}>{o.name[0].toUpperCase()}</div>
                                <div style={{flex:1, minWidth:0}}>
                                  <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--ink)",margin:0,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.name}</p>
                                  <p style={{fontFamily:"'Lora',serif",fontSize:".62rem",color:"var(--ink3)",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {importData.length > 0 && (
                  <button 
                    onClick={() => {
                      if (selectedImportIndices.size === importData.length) setSelectedImportIndices(new Set());
                      else setSelectedImportIndices(new Set(importData.map((_, i) => i)));
                    }}
                    style={{
                      background: "none", border: "1.5px solid var(--line)", padding: "6px 12px", borderRadius: 10,
                      fontFamily: "'Lora',serif", fontSize: ".72rem", color: "var(--ink2)", cursor: "pointer",
                      transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0
                    }}
                    onMouseEnter={e => {e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"}}
                    onMouseLeave={e => {e.currentTarget.style.borderColor="var(--line)"; e.currentTarget.style.color="var(--ink2)"}}
                  >
                    {selectedImportIndices.size === importData.length ? "Batal Semua" : "Pilih Semua"}
                  </button>
                )}
              </div>
              
              <div style={{maxHeight:320,overflowY:"auto",paddingRight:2,margin:"12px 0 24px",borderTop:"1px solid var(--line)",borderBottom:"1px solid var(--line)"}} className="custom-scrollbar">
                <div className="imp-prev">
                  {importData.map((n: any, i: number) => {
                    const m = n.mood != null ? MOODS[n.mood] : null;
                    const isSelected = selectedImportIndices.has(i);
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          const next = new Set(selectedImportIndices);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          setSelectedImportIndices(next);
                        }}
                        style={{
                          padding:"14px 10px",
                          borderBottom:i===importData.length-1?"none":"1px solid var(--line)",
                          cursor:"pointer",
                          background:isSelected?"rgba(196,149,106,.03)":"transparent",
                          transition:"background .15s",
                          display:"flex",
                          alignItems:"center",
                          gap:14,
                          borderRadius: 8,
                          margin: "2px 0"
                        }}
                      >
                        <div style={{
                          width:20,height:20,borderRadius:6,border:`1.5px solid ${isSelected?"var(--accent)":"var(--line)"}`,
                          background:isSelected?"var(--accent)":"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                          transition:"all .2s"
                        }}>
                          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:3}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                              {m && <span style={{fontSize:".9rem",flexShrink:0}}>{m.emoji}</span>}
                              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:600,color:isSelected?"var(--ink)":"var(--ink2)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap", transition:"color .15s"}}>{n.title || "Tanpa Judul"}</p>
                            </div>
                            <span style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",whiteSpace:"nowrap",marginTop:3}}>{n.date}</span>
                          </div>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",margin:0,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{n._preview || <em style={{opacity:.6}}>(Tidak ada teks)</em>}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {importError && <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"#B5705A",marginBottom:16,textAlign:"center"}}>{importError}</p>}
              <div style={{display:"flex",gap:10}}>
                <button style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid var(--line)",background:"var(--surface)",color:"var(--ink2)",fontFamily:"'Lora',serif",fontSize:".88rem",fontWeight:500,cursor:"pointer"}} onClick={()=>setImportConfirmModal(false)}>Batal</button>
                <button 
                  style={{
                    flex:1,padding:"12px",borderRadius:12,border:"none",
                    background:selectedImportIndices.size>0?"var(--accent)":"var(--line)",
                    color:selectedImportIndices.size>0?"#fff":"var(--ink3)",
                    fontFamily:"'Lora',serif",fontSize:".88rem",fontWeight:600,
                    cursor:selectedImportIndices.size>0?"pointer":"not-allowed",
                    boxShadow:selectedImportIndices.size>0?"0 4px 12px rgba(196,149,106,.2)":"none",
                    opacity:importLoading?.7:1,
                    transition:"all .2s"
                  }} 
                  disabled={importLoading || selectedImportIndices.size === 0} 
                  onClick={confirmImport}
                >
                  {importLoading ? "Mengimpor..." : selectedImportIndices.size === 0 ? "Pilih Catatan" : `Impor ${selectedImportIndices.size} Catatan`}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteAllModal && (
          <div className="modal-bg" style={{animation:"modalBgIn .18s ease both"}}>
            <div className="modal" style={{textAlign:"left"}}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:500,color:"var(--ink)",marginBottom:8}}>Hapus Semua Catatan?</h3>
              <p style={{fontFamily:"'Lora',serif",fontSize:".84rem",color:"var(--ink2)",lineHeight:1.6,marginBottom:18}}>Semua {total} catatan akan dihapus permanen. Akun kamu tetap ada. Konfirmasi dengan kata sandi.</p>
              <input style={{...{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".88rem",outline:"none",boxSizing:"border-box"},marginBottom:8}} type="password" placeholder="Kata sandi" value={deleteAllPw} onChange={e=>{setDeleteAllPw(e.target.value);setDeleteAllError("");}} onKeyDown={e=>{if(e.key==="Enter")doDeleteAll();}} autoFocus/>
              {deleteAllError && <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"#B5705A",marginBottom:8}}>{deleteAllError}</p>}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={{flex:1,padding:"11px",borderRadius:11,border:"1px solid var(--line)",background:"var(--surface)",color:"var(--ink2)",fontFamily:"'Lora',serif",fontSize:".86rem",cursor:"pointer"}} onClick={()=>setDeleteAllModal(false)}>Batal</button>
                <button style={{flex:1,padding:"11px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#C27054,#B5624A)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".86rem",fontWeight:500,cursor:"pointer",opacity:deleteAllLoading?.6:1}} disabled={deleteAllLoading} onClick={doDeleteAll}>{deleteAllLoading?"Menghapus...":"Hapus Semua"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Account Modal ── */}
        {deleteAccModal && (
          <div className="modal-bg" style={{animation:"modalBgIn .18s ease both"}}>
            <div className="modal" style={{textAlign:"left"}}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:500,color:"#B5705A",marginBottom:8}}>Hapus Akun?</h3>
              <p style={{fontFamily:"'Lora',serif",fontSize:".84rem",color:"var(--ink2)",lineHeight:1.6,marginBottom:18}}>Akun dan semua catatan kamu akan dihapus permanen. Konfirmasi dengan kata sandi.</p>
              <input style={{...{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".88rem",outline:"none",boxSizing:"border-box"},marginBottom:8}} type="password" placeholder="Kata sandi" value={deleteAccPw} onChange={e=>{setDeleteAccPw(e.target.value);setDeleteAccError("");}} onKeyDown={e=>{if(e.key==="Enter")doDeleteAccount();}} autoFocus/>
              {deleteAccError && <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"#B5705A",marginBottom:8}}>{deleteAccError}</p>}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={{flex:1,padding:"11px",borderRadius:11,border:"1px solid var(--line)",background:"var(--surface)",color:"var(--ink2)",fontFamily:"'Lora',serif",fontSize:".86rem",cursor:"pointer"}} onClick={()=>setDeleteAccModal(false)}>Batal</button>
                <button style={{flex:1,padding:"11px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#C27054,#B5624A)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".86rem",fontWeight:500,cursor:"pointer",opacity:deleteAccLoading?.6:1}} disabled={deleteAccLoading} onClick={doDeleteAccount}>{deleteAccLoading?"Menghapus...":"Hapus Akun"}</button>
              </div>
            </div>
          </div>
        )}

        {exportConfirmModal && (
          <div className="modal-bg" style={{animation:"modalBgIn .18s ease both"}} onClick={e=>{if(e.target===e.currentTarget)setExportConfirmModal(false)}}>
            <div className="modal" style={{textAlign:"left", maxWidth: 440, padding: "28px 28px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:12}}>
                <div style={{flex:1}}>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:500,color:"var(--ink)",margin:0,lineHeight:1.1}}>Pilih Catatan Ekspor</h3>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",lineHeight:1.5,marginTop:6,marginBottom:0}}>
                    Pilih catatan yang ingin kamu ekspor ke dalam file JSON.
                  </p>
                </div>
                {exportData.length > 0 && (
                  <button 
                    onClick={() => {
                      if (selectedExportIndices.size === exportData.length) setSelectedExportIndices(new Set());
                      else setSelectedExportIndices(new Set(exportData.map((_, i) => i)));
                    }}
                    style={{
                      background: "none", border: "1.5px solid var(--line)", padding: "6px 12px", borderRadius: 10,
                      fontFamily: "'Lora',serif", fontSize: ".72rem", color: "var(--ink2)", cursor: "pointer",
                      transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0
                    }}
                  >
                    {selectedExportIndices.size === exportData.length ? "Batal Semua" : "Pilih Semua"}
                  </button>
                )}
              </div>
              
              <div style={{maxHeight:320,overflowY:"auto",paddingRight:2,margin:"12px 0 24px",borderTop:"1px solid var(--line)",borderBottom:"1px solid var(--line)"}} className="custom-scrollbar">
                <div className="imp-prev">
                  {exportData.map((n: any, i: number) => {
                    const m = n.mood != null ? MOODS[n.mood] : null;
                    const isSelected = selectedExportIndices.has(i);
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          const next = new Set(selectedExportIndices);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          setSelectedExportIndices(next);
                        }}
                        style={{
                          padding:"14px 10px",
                          borderBottom:i===exportData.length-1?"none":"1px solid var(--line)",
                          cursor:"pointer",
                          background:isSelected?"rgba(196,149,106,.03)":"transparent",
                          transition:"background .15s",
                          display:"flex",
                          alignItems:"center",
                          gap:14,
                          borderRadius: 8,
                          margin: "2px 0"
                        }}
                      >
                        <div style={{
                          width:20,height:20,borderRadius:6,border:`1.5px solid ${isSelected?"var(--accent)":"var(--line)"}`,
                          background:isSelected?"var(--accent)":"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                          transition:"all .2s"
                        }}>
                          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:3}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                              {m && <span style={{fontSize:".9rem",flexShrink:0}}>{m.emoji}</span>}
                              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:600,color:isSelected?"var(--ink)":"var(--ink2)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title || "Tanpa Judul"}</p>
                            </div>
                            <span style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",whiteSpace:"nowrap",marginTop:3}}>{n.date}</span>
                          </div>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",margin:0,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{n._preview || <em style={{opacity:.6}}>(Tidak ada teks)</em>}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{display:"flex",gap:10}}>
                <button style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid var(--line)",background:"var(--surface)",color:"var(--ink2)",fontFamily:"'Lora',serif",fontSize:".88rem",fontWeight:500,cursor:"pointer"}} onClick={()=>setExportConfirmModal(false)}>Batal</button>
                <button 
                  style={{
                    flex:1,padding:"12px",borderRadius:12,border:"none",
                    background:selectedExportIndices.size>0?"var(--accent)":"var(--line)",
                    color:selectedExportIndices.size>0?"#fff":"var(--ink3)",
                    fontFamily:"'Lora',serif",fontSize:".88rem",fontWeight:600,
                    cursor:selectedExportIndices.size>0?"pointer":"not-allowed",
                    boxShadow:selectedExportIndices.size>0?"0 4px 12px rgba(196,149,106,.2)":"none",
                    opacity:exportLoading?.7:1
                  }} 
                  disabled={exportLoading || selectedExportIndices.size === 0} 
                  onClick={() => {
                    const selectedIds = exportData.filter((_, i) => selectedExportIndices.has(i)).map(n => n.id);
                    doExport(selectedIds);
                  }}
                >
                  {exportLoading ? "Mengekspor..." : selectedExportIndices.size === 0 ? "Pilih Catatan" : `Ekspor ${selectedExportIndices.size} Catatan`}
                </button>
              </div>
            </div>
          </div>
        )}
      {/* ── Multi-select delete bar ── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="sel-bar">
          <span className="sel-bar-count">{selectedIds.size} dipilih</span>
          <div className="sel-bar-div"/>
          <button className="sel-bar-btn" onClick={()=>{const all=filtered.map((e:any)=>e.id);setSelectedIds(new Set(all));}}>Pilih Semua</button>
          <div className="sel-bar-div"/>
          <button className="sel-bar-del" onClick={()=>{
            const hasLocked = Array.from(selectedIds).some(id => {
              const n = entries[id]; return n?.isLocked && !unlockedIds.includes(id);
            });
            if (hasLocked) { setBulkVerifyDelete(true); } else { setBulkDeleteConfirm(true); }
          }}>Hapus {selectedIds.size}</button>
        </div>
      )}

      {/* FAB — desktop only (hidden on mobile via CSS) */}
      {(view==="home"||view==="calendar"||view==="list") && !selectMode && (
        <button className="fab" onClick={()=>newEntry(todayStr)}><Ic d={IC.plus} size={22} sw={2}/></button>
      )}
      {CompanionOverlay}

      {/* ── Mobile bottom nav ── */}
      {(view==="home"||view==="list"||view==="calendar"||view==="settings"||view==="map") && (
        <nav className="mob-nav">
          <button className={`mob-nav-btn ${view==="home"?"act":""}`} onClick={()=>nav("home")}>
            <Ic d={IC.home} size={20} sw={1.6} color={view==="home"?"var(--accent)":"var(--ink3)"}/>
            <span className="mlbl">Beranda</span>
          </button>
          <button className={`mob-nav-btn ${view==="list"?"act":""}`} onClick={()=>nav("list")}>
            <Ic d={IC.search} size={20} sw={1.5} color={view==="list"?"var(--accent)":"var(--ink3)"}/>
            <span className="mlbl">Cari</span>
          </button>
          <button className="mob-nav-ctr" onClick={()=>newEntry(todayStr)} aria-label="Tulis catatan baru">
            <div className="mob-nav-ctr-ico">
              <Ic d={IC.plus} size={20} sw={2.2} color="#fff"/>
            </div>
            <span className="mlbl">Tulis</span>
          </button>
          <button className={`mob-nav-btn ${view==="map"?"act":""}`} onTouchStart={preloadLeaflet} onClick={()=>nav("map")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={view==="map"?"var(--accent)":"var(--ink3)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="mlbl">Peta</span>
          </button>
          <button className={`mob-nav-btn ${view==="settings"?"act":""}`} onClick={()=>{nav("settings");loadProfile();}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={view==="settings"?"var(--accent)":"var(--ink3)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
            <span className="mlbl">Profil</span>
          </button>
        </nav>
      )}

      {/* ── Mobile action sheet (write & read views) ── */}
      {showMobActions && (view==="write"||view==="read") && entry && (
        <BottomSheet onClose={()=>setShowMobActions(false)} title="Aksi">
            <button className="asheet-row" onClick={()=>{upd("isPinned",!entry.isPinned);setShowMobActions(false);}}>
              <Ic d={IC.pin} size={20} sw={1.8} color={entry.isPinned?"var(--accent)":"var(--ink2)"}/>
              <span style={{color:entry.isPinned?"var(--accent)":"var(--ink)"}}>{entry.isPinned?"Lepas Pin":"Pin Catatan"}</span>
            </button>
            <button className="asheet-row" onClick={()=>{
              if (!entry.isProfilePinned) {
                const profCount = Object.values(entries).filter((e:any) => e.isProfilePinned).length;
                if (profCount >= 3) { setPinLimitToast(true); setTimeout(() => setPinLimitToast(false), 2500); return; }
              }
              upd("isProfilePinned",!entry.isProfilePinned);setShowMobActions(false);
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={entry.isProfilePinned?"var(--accent)":"var(--ink2)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{color:entry.isProfilePinned?"var(--accent)":"var(--ink)"}}>{entry.isProfilePinned?"Lepas dari Profil":"Pin ke Profil"}</span>
            </button>
            <button className="asheet-row" onClick={()=>{setShowMobActions(false);if(!entry.isLocked&&!entry.isModerated)setShowShare(true);}} style={{opacity:(entry.isLocked||entry.isModerated)?.45:1,cursor:(entry.isLocked||entry.isModerated)?"not-allowed":"pointer"}}>
              <Ic d={IC.share} size={20} sw={1.8} color={entry.shareId&&!entry.isModerated?"var(--accent)":"var(--ink2)"}/>
              <span style={{color:entry.shareId&&!entry.isModerated?"var(--accent)":"var(--ink)"}}>Bagikan{entry.isLocked?" (Catatan Terkunci)":entry.isModerated?" (Dibatasi Admin)":""}</span>
            </button>
            <button className="asheet-row" onClick={()=>{setShowDownloadModal(true);setShowMobActions(false);}}>
              <Ic d={IC.download} size={20} sw={1.8} color="var(--ink2)"/>
              <span>Unduh</span>
            </button>
            <button className="asheet-row" onClick={()=>{
              setShowMobActions(false);
              if (entry.isLocked) {
                fetch("/api/notes/lock", { method:"DELETE", headers:{"Content-Type":"application/json","X-CSRF-Token":csrfRef.current}, body: JSON.stringify({noteId: entry.id}) }).catch(()=>{});
                upd("isLocked", false);
              } else {
                setShowLockModal(true);
              }
            }}>
              <Ic d={entry.isLocked?IC.lock:IC.unlock} size={20} sw={1.8} color={entry.isLocked?"var(--accent)":"var(--ink2)"}/>
              <span style={{color:entry.isLocked?"var(--accent)":"var(--ink)"}}>{entry.isLocked?"Lepas Kunci":"Kunci Catatan"}</span>
            </button>
            {view==="read" && (
              <button className="asheet-row" onClick={()=>{setShowMobActions(false);nav("write",selId);}}>
                <Ic d={IC.edit} size={20} sw={1.8} color="var(--ink2)"/>
                <span>Edit Catatan</span>
              </button>
            )}
            {(view==="write"||view==="read") && (
              <button className="asheet-row" onClick={()=>{setShowMobActions(false);setFocusModeWrapper(true);}}>
                <Ic d={IC.focus} size={20} sw={1.8} color="var(--ink2)"/>
                <span>Mode Fokus</span>
              </button>
            )}
            <button className="asheet-row" onClick={()=>{if(!entry.isLocked){setShowMobActions(false);duplicateNote(entry);}}} style={{opacity:entry.isLocked?.45:1,cursor:entry.isLocked?"not-allowed":"pointer"}}>
              <Ic d={IC.copy} size={20} sw={1.8} color="var(--ink2)"/>
              <span>Duplikat{entry.isLocked?" (Terkunci)":""}</span>
            </button>
            <div className="asheet-sep"/>
            <button className="asheet-row asheet-danger" onClick={()=>{setShowMobActions(false);requestDelete(entry);}}>
              <Ic d={IC.trash} size={20} sw={1.8} color="#B5705A"/>
              <span>Hapus Catatan</span>
            </button>
        </BottomSheet>
      )}

      {/* ── Mobile style sheet (write view: color + theme) ── */}
      {showMobStyle && view==="write" && entry && (
        <BottomSheet onClose={()=>setShowMobStyle(false)}>
          <div style={{padding:"0 20px 8px",overflowY:"auto",maxHeight:"65vh"}}>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Warna Catatan</p>
              <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
                {NOTE_COLORS.map(c=>(
                  <button key={c.id} title={c.label} onClick={()=>upd("color",c.id)}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",padding:4}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:c.bg||"#FAF6F0",border:`2.5px solid ${entry.color===c.id?(c.accent||"var(--accent)"):"var(--line)"}`,boxShadow:entry.color===c.id?`0 0 0 3px ${c.accent||"var(--accent)"}30`:"none",transition:"all .15s"}}/>
                    <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:entry.color===c.id?(c.accent||"var(--accent)"):"var(--ink3)",whiteSpace:"nowrap"}}>{c.label}</span>
                  </button>
                ))}
              </div>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Tema Catatan</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
                {NOTE_THEMES.filter((t:any)=>!(t.seasonal==='ramadan'&&!isRamadan)||(entry.theme===t.id)).map(t=>{
                  const isActive=entry.theme===t.id;
                  return (
                    <button key={t.id} onClick={()=>upd("theme",isActive?'':t.id)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${isActive?t.accent:"var(--line)"}`,background:isActive?t.bg:"var(--surface)",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                      <span style={{fontSize:"1.2rem"}}>{t.emoji}</span>
                      <div>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:isActive?t.accent:"var(--ink)",fontWeight:isActive?600:400,lineHeight:1.2}}>
                          {t.label}{(t as any).seasonal==='ramadan'&&<span style={{display:"block",fontSize:".58rem",background:`${t.accent}22`,color:t.accent,padding:"1px 5px",borderRadius:3,marginTop:1,fontWeight:500,width:"fit-content"}}>🌙 Ramadan</span>}
                        </p>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",lineHeight:1.2}}>{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Font</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
                {NOTE_FONTS.map(f=>{
                  const isActive=(entry.font||'')===f.id;
                  return (
                    <button key={f.id} onClick={()=>upd("font",f.id)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${isActive?"var(--accent)":"var(--line)"}`,background:isActive?"var(--accent-soft)":"var(--surface)",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                      <span style={{fontFamily:f.family,fontSize:"1.2rem",fontWeight:500,color:isActive?"var(--accent)":"var(--ink)",flexShrink:0}}>{f.sample}</span>
                      <div>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:isActive?"var(--accent)":"var(--ink)",fontWeight:isActive?600:400,lineHeight:1.2}}>{f.label}</p>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".66rem",color:"var(--ink3)",lineHeight:1.2}}>{f.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Label</p>
              {(entry.tags||[]).length > 0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                  {(entry.tags||[]).map((t:string) => (
                    <span key={t} className="tag-chip" onClick={()=>removeTag(t)}>#{t} ×</span>
                  ))}
                </div>
              )}
              <input className="tag-input" placeholder="+ tambah label, Enter" value={tagInput}
                onChange={(e:any)=>setTagInput(e.target.value)}
                onKeyDown={(e:any)=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(tagInput);setTagInput('');}}}
                style={{marginBottom:8}}
              />
              <p className="no-print" style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginTop:16,marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Musik</p>
              {entry.songId && (
                <div className="no-print" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:"1.5px solid var(--accent)",background:"var(--accent-soft)",marginBottom:10}}>
                  {entry.songArtwork && <img src={entry.songArtwork} alt="" style={{width:38,height:38,borderRadius:7,objectFit:"cover",flexShrink:0}}/>}
                  <div style={{flex:1,overflow:"hidden"}}>
                    <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--accent)",fontWeight:600,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.songTitle}</p>
                    <p style={{fontFamily:"'Lora',serif",fontSize:".63rem",color:"var(--ink3)",margin:0}}>Sedang diputar saat catatan dibuka</p>
                  </div>
                  <button onClick={()=>{updMany({songId:"",songTitle:"",songArtwork:"",songPreview:""});}} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"rgba(0,0,0,.08)",cursor:"pointer",fontSize:".7rem",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>
              )}
              <input
                className="no-print"
                placeholder="🎵 Cari lagu..."
                value={songSearch}
                onChange={e=>{
                  const v=e.target.value; setSongSearch(v);
                  if(songSearchTimer.current) clearTimeout(songSearchTimer.current);
                  if(!v.trim()){setSongResults([]);return;}
                  setSongSearching(true);
                  songSearchTimer.current=setTimeout(async()=>{
                    try{const r=await fetch(`/api/music/search?q=${encodeURIComponent(v)}`);const d=await r.json();setSongResults(d);}catch{}
                    setSongSearching(false);
                  },400);
                }}
                style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".82rem",outline:"none",boxSizing:"border-box",marginBottom:8}}
              />
              {songSearching && <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--ink3)",textAlign:"center",padding:"8px 0"}}>Mencari...</p>}
              {!songSearching && songResults.length===0 && songSearch.trim() && <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--ink3)",textAlign:"center",padding:"8px 0"}}>Tidak ada hasil</p>}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {songResults.map((s:any)=>(
                  <button key={s.id} onClick={()=>{updMany({songId:s.id,songTitle:`${s.title} - ${s.artist}`,songArtwork:s.artwork,songPreview:s.previewUrl});setSongResults([]);setSongSearch("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:11,border:`1.5px solid ${entry.songId===s.id?"var(--accent)":"var(--line)"}`,background:entry.songId===s.id?"var(--accent-soft)":"var(--surface)",cursor:"pointer",textAlign:"left"}}>
                    {s.artwork && <img src={s.artwork} alt="" style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
                    <div style={{overflow:"hidden"}}>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:entry.songId===s.id?"var(--accent)":"var(--ink)",fontWeight:500,lineHeight:1.2,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</p>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".67rem",color:"var(--ink3)",lineHeight:1.2,margin:0}}>{s.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{borderTop:"1px solid var(--line)",marginTop:12,paddingTop:12}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",marginBottom:6}}>▶ Atau paste link YouTube</p>
                <div style={{display:"flex",gap:8}}>
                  <input value={ytUrl} onChange={e=>{setYtUrl(e.target.value);setYtError("");setYtPreview(null);}} placeholder="https://youtube.com/watch?v=..." onKeyDown={e=>{if(e.key==="Enter"&&ytUrl.trim())addYouTubeSong(ytUrl.trim());}} style={{flex:1,padding:"8px 10px",borderRadius:9,border:"1px solid var(--line)",background:"var(--bg)",color:"var(--ink)",fontFamily:"'Lora',serif",fontSize:".78rem",outline:"none"}}/>
                  <button onClick={()=>{if(ytUrl.trim())addYouTubeSong(ytUrl.trim());}} disabled={ytLoading||!ytUrl.trim()} style={{padding:"8px 14px",borderRadius:9,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"'Lora',serif",fontSize:".78rem",cursor:"pointer",opacity:ytLoading||!ytUrl.trim()?0.5:1}}>{ytLoading?"...":"Cek"}</button>
                </div>
                {ytError && <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"#c0392b",marginTop:5}}>{ytError}</p>}
                {ytPreview && (
                  <button onClick={()=>confirmYtSong(ytPreview)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",marginTop:8,padding:"8px 10px",borderRadius:11,border:"1.5px solid var(--accent)",background:"var(--accent-soft)",cursor:"pointer",textAlign:"left" as const}}>
                    <img src={ytPreview.thumbnail} alt="" style={{width:44,height:44,borderRadius:8,objectFit:"cover" as const,flexShrink:0}}/>
                    <div style={{overflow:"hidden",flex:1,minWidth:0}}>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--accent)",fontWeight:600,lineHeight:1.2,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ytPreview.title}</p>
                      <p style={{fontFamily:"'Lora',serif",fontSize:".67rem",color:"var(--ink3)",lineHeight:1.2,margin:0}}>{ytPreview.author} · Tap untuk pilih</p>
                    </div>
                  </button>
                )}
              </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}