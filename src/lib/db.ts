import { collection, doc, getDocs, setDoc, updateDoc, onSnapshot, query } from "firebase/firestore";
import { db, auth } from "./firebase";
import { ArticleAnalysis, ResearchProfile, SLRData } from "../types";
import { onAuthStateChanged } from "firebase/auth";

// Hook or listener for articles
export const subscribeToArticles = (userId: string, callback: (articles: ArticleAnalysis[]) => void) => {
  const q = query(collection(db, "users", userId, "articles"));
  return onSnapshot(q, (snapshot) => {
    const articles = snapshot.docs.map(doc => doc.data() as ArticleAnalysis);
    callback(articles.sort((a, b) => b.year.localeCompare(a.year)));
  });
};

export const subscribeToSettings = (userId: string, callback: (settings: ResearchProfile) => void) => {
  const d = doc(db, "users", userId, "profile", "settings");
  return onSnapshot(d, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as ResearchProfile);
    }
  });
};

export const saveArticleToDb = async (userId: string, article: ArticleAnalysis) => {
  const articleRef = doc(db, "users", userId, "articles", article.id);
  // Don't save pdfUrl to DB since it's a blob url
  const { pdfUrl, ...dbArticle } = article;
  await setDoc(articleRef, dbArticle, { merge: true });
};

export const updateArticleInDb = async (userId: string, articleId: string, updates: Partial<ArticleAnalysis>) => {
  const articleRef = doc(db, "users", userId, "articles", articleId);
  await updateDoc(articleRef, updates);
};

export const saveSettingsToDb = async (userId: string, settings: ResearchProfile) => {
  const settingsRef = doc(db, "users", userId, "profile", "settings");
  await setDoc(settingsRef, settings, { merge: true });
};

export const subscribeToCSVData = (userId: string, callback: (data: SLRData | null) => void) => {
  const d = doc(db, "users", userId, "profile", "csvData");
  return onSnapshot(d, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as SLRData);
    } else {
      callback(null);
    }
  });
};

export const saveCSVDataToDb = async (userId: string, data: SLRData) => {
  const dataRef = doc(db, "users", userId, "profile", "csvData");
  await setDoc(dataRef, data, { merge: true });
};
