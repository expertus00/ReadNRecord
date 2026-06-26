import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ───────────────────────────────────────────────────
// DOM 요소
// ───────────────────────────────────────────────────
const form         = document.getElementById("reflectionForm");
const entryList    = document.getElementById("entryList");
const entryCount   = document.getElementById("entryCount");
const searchInput  = document.getElementById("searchInput");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelEdit");

let currentEditId = null;
let allEntries    = [];

// Firestore 컬렉션 참조
const reflectionsRef = collection(db, "reflections");

// ───────────────────────────────────────────────────
// 유틸리티
// ───────────────────────────────────────────────────
function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function filterEntries(entries) {
  const queryText = searchInput.value.trim().toLowerCase();
  if (!queryText) return entries;
  return entries.filter((entry) =>
    [entry.title, entry.author, entry.text].some((value) =>
      value.toLowerCase().includes(queryText)
    )
  );
}

// ───────────────────────────────────────────────────
// 렌더링
// ───────────────────────────────────────────────────
function renderEntries(entries) {
  const filtered = filterEntries(entries);
  entryList.innerHTML = "";

  if (filtered.length === 0) {
    entryList.innerHTML = '<p class="empty-state">검색 결과가 없습니다.</p>';
  } else {
    filtered.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "entry-card";
      card.innerHTML = `
        <h3 class="entry-title">${entry.title}</h3>
        <div class="entry-meta">
          <span>저자: ${entry.author}</span>
          <span>작성일: ${formatDate(entry.date)}</span>
          <span>평점: ${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)}</span>
        </div>
        <p class="entry-text">${entry.text}</p>
        <div class="entry-actions">
          <button class="edit-button"   data-id="${entry.id}">수정</button>
          <button class="delete-button" data-id="${entry.id}">삭제</button>
        </div>
      `;
      entryList.appendChild(card);
    });
  }

  entryCount.textContent = `${entries.length}개`;
}

// ───────────────────────────────────────────────────
// Firestore 실시간 리스너 (onSnapshot)
// ───────────────────────────────────────────────────
const q = query(reflectionsRef, orderBy("createdAt", "desc"));

onSnapshot(
  q,
  (snapshot) => {
    allEntries = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    renderEntries(allEntries);
  },
  (error) => {
    console.error("Firestore 연결 오류:", error);
    entryList.innerHTML =
      '<p class="empty-state">데이터를 불러오는 중 오류가 발생했습니다.</p>';
  }
);

// ───────────────────────────────────────────────────
// CRUD 함수
// ───────────────────────────────────────────────────
async function addEntry(entryData) {
  await addDoc(reflectionsRef, {
    ...entryData,
    createdAt: serverTimestamp(),
  });
}

async function updateEntry(id, entryData) {
  await updateDoc(doc(db, "reflections", id), entryData);
}

async function deleteEntry(id) {
  await deleteDoc(doc(db, "reflections", id));
}

// ───────────────────────────────────────────────────
// 폼 관련
// ───────────────────────────────────────────────────
function clearForm() {
  form.reset();
  currentEditId = null;
  submitButton.textContent = "저장하기";
  cancelButton.classList.add("hidden");
}

function fillForm(entry) {
  document.getElementById("bookTitle").value       = entry.title;
  document.getElementById("bookAuthor").value      = entry.author;
  document.getElementById("reflectionDate").value  = entry.date;
  document.getElementById("bookRating").value      = entry.rating;
  document.getElementById("reflectionText").value  = entry.text;
  currentEditId = entry.id;
  submitButton.textContent = "수정 완료";
  cancelButton.classList.remove("hidden");
}

// ───────────────────────────────────────────────────
// 이벤트 리스너
// ───────────────────────────────────────────────────
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const entryData = {
    title:  document.getElementById("bookTitle").value.trim(),
    author: document.getElementById("bookAuthor").value.trim(),
    date:   document.getElementById("reflectionDate").value,
    rating: Number(document.getElementById("bookRating").value),
    text:   document.getElementById("reflectionText").value.trim(),
  };

  if (!entryData.title || !entryData.author || !entryData.date || !entryData.rating || !entryData.text) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "저장 중...";

  try {
    if (currentEditId) {
      await updateEntry(currentEditId, entryData);
    } else {
      await addEntry(entryData);
    }
    clearForm();
  } catch (error) {
    console.error("저장 실패:", error);
    alert("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    submitButton.textContent = currentEditId ? "수정 완료" : "저장하기";
  } finally {
    submitButton.disabled = false;
  }
});

entryList.addEventListener("click", (event) => {
  const editButton   = event.target.closest(".edit-button");
  const deleteButton = event.target.closest(".delete-button");

  if (editButton) {
    const id    = editButton.dataset.id;
    const entry = allEntries.find((item) => item.id === id);
    if (!entry) return;
    fillForm(entry);
    return;
  }

  if (deleteButton) {
    const id = deleteButton.dataset.id;
    if (!id) return;
    if (confirm("이 감상문을 삭제하시겠습니까?")) {
      deleteEntry(id).catch((err) => {
        console.error("삭제 실패:", err);
        alert("삭제에 실패했습니다.");
      });
    }
  }
});

searchInput.addEventListener("input", () => renderEntries(allEntries));
cancelButton.addEventListener("click", clearForm);
