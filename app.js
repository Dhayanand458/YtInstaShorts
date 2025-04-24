import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, where, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// ✅ Firebase config (UNCHANGED)
const firebaseConfig = {
  apiKey: "AIzaSyD-cyc8TKCivaFTAgcn4AmYCKSe7wN7Lc8",
  authDomain: "testing-3a7dc.firebaseapp.com",
  projectId: "testing-3a7dc",
  storageBucket: "testing-3a7dc.appspot.com",
  messagingSenderId: "505948038047",
  appId: "1:505948038047:web:d538b1b738ba0fdf4c93aa"
};

// ✅ Initialize Firebase (UNCHANGED)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const linksRef = collection(db, "links");

// ✅ URL Normalization (NOW CHANGED)
function normalizeUrl(url) {
  // Handle YouTube Shorts
  if (url.includes('youtube.com/shorts/') || url.includes('youtu.be/')) {
    const videoId = url.split('/shorts/')[1]?.split('?')[0] || 
                   url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) return `youtube.com/shorts/${videoId}`;
  }
  // Default normalization
  return url.trim().toLowerCase().replace(/\/$/, '').split('?')[0];
}

// ✅ Page A: Submit Link (UI-Enhanced Messages)
export async function submitLink() {
  const input = document.getElementById("linkInput");
  const rawLink = input.value;
  const message = document.getElementById("message");
  message.className = "status-message"; // Reset class

  if (!rawLink) {
    message.textContent = "Please enter a URL";
    message.style.color = "#ff4757";
    return;
  }

  const newLink = normalizeUrl(rawLink);

  try {
    const snapshot = await getDocs(linksRef);
    for (let docSnap of snapshot.docs) {
      if (normalizeUrl(docSnap.data().url) === newLink) {
        message.textContent = "⛔ Link already exists";
        message.style.color = "#ff4757";
        return;
      }
    }

    await addDoc(linksRef, {
      url: rawLink.trim(),
      visible: true,
      timestamp: Date.now()
    });

    input.value = "";
    message.textContent = "✅ Link saved successfully!";
    message.style.color = "#2ed573";
    setTimeout(() => window.location.href = "pageB.html", 800);

  } catch (error) {
    message.textContent = "⚠️ Error: " + error.message;
    message.style.color = "#ffa502";
  }
}

// ✅ Page B: Load Links (UI-Enhanced List Items)
export async function loadLinksToPageB() {
  const linkList = document.getElementById("linkList");
  linkList.innerHTML = "";

  try {
    const snapshot = await getDocs(query(linksRef, where("visible", "==", true)));
    let count = 1;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const url = data.url;
      const li = document.createElement("li");
      li.className = "link-item"; // New UI class

      // Numbering
      const label = document.createElement("div");
      label.className = "link-number";
      label.textContent = `${count++}.`;
      li.appendChild(label);

      // Content Container
      const content = document.createElement("div");
      content.className = "link-content";

      // Embeds
      if (url.includes("youtube.com/shorts")) {
        const videoId = url.split("/shorts/")[1]?.split("?")[0];
        if (videoId) {
          const iframe = document.createElement("iframe");
          iframe.src = `https://www.youtube.com/embed/${videoId}`;
          iframe.width = "100%";
          iframe.height = "200";
          iframe.allowFullscreen = true;
          iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
          content.appendChild(iframe);
        }
      } 
      else if (url.includes("instagram.com/reel")) {
        const blockquote = document.createElement("blockquote");
        blockquote.className = "instagram-media";
        blockquote.dataset.instgrmPermalink = url;
        blockquote.dataset.instgrmVersion = "14";
        content.appendChild(blockquote);
        
        if (!document.getElementById("insta-embed-script")) {
          const script = document.createElement("script");
          script.id = "insta-embed-script";
          script.src = "https://www.instagram.com/embed.js";
          document.body.appendChild(script);
        }
      } 
      else {
        const a = document.createElement("a");
        a.href = url;
        a.textContent = url;
        a.target = "_blank";
        a.className = "link-url";
        content.appendChild(a);
      }

      li.appendChild(content);

      // Remove Button (UI-Enhanced)
      const btn = document.createElement("button");
      btn.className = "remove-button";
      btn.innerHTML = '<i class="fas fa-trash"></i> Remove';
      btn.onclick = async () => {
        await updateDoc(doc(linksRef, docSnap.id), { visible: false });
        loadLinksToPageB();
      };
      li.appendChild(btn);

      linkList.appendChild(li);
    });

    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
    }

  } catch (error) {
    linkList.innerHTML = `<li class="error-message">⚠️ Error loading links: ${error.message}</li>`;
  }
}

// ✅ Debug Function (UNCHANGED)
export async function fetchAllLinksForDebug() {
  const list = document.getElementById("allLinks");
  if (!list) return;

  const snapshot = await getDocs(linksRef);
  list.innerHTML = "<h3>All links in DB (debug):</h3>";

  snapshot.forEach(docSnap => {
    const li = document.createElement("li");
    li.textContent = `${docSnap.data().url} [visible: ${docSnap.data().visible}]`;
    list.appendChild(li);
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service worker registered.', reg));
}
