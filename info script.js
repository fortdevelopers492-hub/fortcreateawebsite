// Initialize Core System Storage Buckets Structure
if (!localStorage.getItem("SYSTEM_DATABASE")) {
    window.SYSTEM_DATABASE = {
        users: [
            { uid: "admin", identifierText: "Admin", secretKey: "Admin@123", dialingCode: "234" }
        ],
        chats: [],
        templates: [
            { 
                id: "tmpl_001", 
                name: "E-Commerce Basic", 
                category: "Retail", 
                description: "Clean grid layout with minimal shopping cart utilities.", 
                images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500"] 
            },
            { 
                id: "tmpl_002", 
                name: "Creative Agency Portfolio", 
                category: "Corporate", 
                description: "Bespoke look targeted toward digital agencies.", 
                images: ["https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500"] 
            },
            { 
                id: "tmpl_003", 
                name: "SaaS Application Landing Page", 
                category: "Tech", 
                description: "High converting dark layout showcasing technical copy fields.", 
                images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500"] 
            },
            { 
                id: "tmpl_004", 
                name: "Fort", 
                category: "Tech", 
                description: "A website advertising Fort", 
                images: ["tmpl_004_1.png", "tmpl_004_2.png", "tmpl_004_3.png", "tmpl_004_4.png"] 
            }
        ]
    };
    localStorage.setItem("SYSTEM_DATABASE", JSON.stringify(window.SYSTEM_DATABASE));
} else {
    window.SYSTEM_DATABASE = JSON.parse(localStorage.getItem("SYSTEM_DATABASE"));
}

window.APP_STATE = { currentUser: null, currentProject: { id: null, name: "", layouts: "", features: "", linkedTemplates: [], linkedFiles: [] } };
        
// Initializing EmailJS Service Keys
(function() {
    emailjs.init("YOUR_PUBLIC_KEY_HERE"); 
})();

document.addEventListener("DOMContentLoaded", () => {
    evaluateRootAuthenticationContextState();
});

function evaluateRootAuthenticationContextState() {
    if (APP_STATE.currentUser) {
        renderWorkspaceMainView(); 
        return;
    }
    triggerAuthenticationModalSequence();
}

function triggerAuthenticationModalSequence() {
    try {
        const savedSessionRaw = localStorage.getItem("fort_mart_remembered_user");
        if (savedSessionRaw) { 
            const savedData = JSON.parse(savedSessionRaw);
            const currentTime = Date.now(); 
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

            if (currentTime - savedData.timestamp < sevenDaysInMs) {
                renderRememberedUserPromptLayout(savedData);
                document.getElementById("auth-modal").classList.add("active");
                return;
            } else {
                localStorage.removeItem("fort_mart_remembered_user"); 
            }
        }
    } catch (e) {
        console.error("Authentication read safety break:", e);
        localStorage.removeItem("fort_mart_remembered_user"); 
    }
    renderInitialGatekeeperModal(); 
}

function renderInitialGatekeeperModal() {
    const node = document.getElementById("auth-modal-content");
    node.innerHTML = `
        <div style="background-color: white; text-align: center;">
            <h2 style="margin-bottom: 20px;">Start/Continue Creating Your Website</h2>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="btn-blue" onclick="renderSignInFormLayout()">Sign In</button>
                <button class="btn-blue" onclick="renderSignUpFormLayout()">Sign Up</button>
                <button class="btn-blue"><a href="index.html">Home</a></button> 
            </div>
        </div>
    `; 
    document.getElementById("auth-modal").classList.add("active");
}

function renderRememberedUserPromptLayout(savedData) {
    const wrapperTargetNode = document.getElementById("auth-modal-content");
    const safeUid = (savedData.uid || '').replace(/'/g, "\\'"); 
    const safeIdentifier = (savedData.identifierText || 'User').replace(/'/g, "\\'"); 

    wrapperTargetNode.innerHTML = `
        <h2>Welcome Back to Fort Mart</h2>
        <div class="text-center margin-top-sm margin-bottom-sm">
            <p style="font-size: 1.1rem;">Would you like to continue using your saved account?</p>
        </div>
        <div class="btn-group" style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="executeRememberedUserSignIn('${safeUid}')" class="btn-blue" style="width: 100%;">
                Continue with ${safeIdentifier}
            </button> 
            <button onclick="renderSignInFormLayout()" class="btn-gray" style="width: 100%;">
                Sign in as new user
            </button>
        </div>
    `;
}


function executeRememberedUserSignIn(uid) {
    const matchedUser = SYSTEM_DATABASE.users.find(u => u.uid === uid);
    if (!matchedUser) { 
        localStorage.removeItem("fort_mart_remembered_user");
        renderSignInFormLayout();
        return;
    }
    finalizeAuthSuccess(matchedUser);
}

function renderSignInFormLayout() {
    const wrapperTargetNode = document.getElementById("auth-modal-content");
    wrapperTargetNode.innerHTML = `
        <h2>Sign In to Project</h2>
        <div class="form-input-container margin-top-sm">
            <label>Select Country Context Line:</label>
            <select id="auth-signin-country" class="form-field-control">
                <option value="Nigeria|+234">Nigeria (+234)</option>
            </select>
        </div>
        <div class="form-input-container">
            <label>Project Name</label>
            <input type="text" id="auth-signin-identifier" class="form-field-control" placeholder="Input your project name"> 
            <div id="err-signin-identifier" class="text-danger-alert hidden-node"></div>
        </div>
        <div class="form-input-container">
            <label>Password</label>
            <input type="password" id="auth-signin-password" class="form-field-control" placeholder="Enter password">
            <div id="err-signin-password" class="text-danger-alert hidden-node"></div>
                    
            <div class="margin-top-xs">
                <input type="checkbox" id="chk-signin-showpass" onchange="toggleFieldVisibility('auth-signin-password', this)">
                <label for="chk-signin-showpass">Show Password</label>
            </div>
            <div class="margin-top-xs">
                <input type="checkbox" id="chk-signin-rememberme">
                <label for="chk-signin-rememberme">Remember Me</label> 
            </div>
        </div>
        <div class="btn-group margin-top-md" style="display:flex; gap:10px;">
            <button onclick="renderInitialGatekeeperModal()" class="btn-gray" style="flex:1;">Back</button>
            <button onclick="executeAccountSignInAuthenticationRequest()" class="btn-blue" style="flex:1;">Sign In</button>
        </div>
    `; 
}

function executeAccountSignInAuthenticationRequest() {
    const countryVal = document.getElementById("auth-signin-country").value.split("|")[1];
    const identifierInput = document.getElementById("auth-signin-identifier").value.trim();
    const passwordInput = document.getElementById("auth-signin-password").value;
            
    const errIdNode = document.getElementById("err-signin-identifier");
    const errPassNode = document.getElementById("err-signin-password");
    errIdNode.classList.add("hidden-node");
    errPassNode.classList.add("hidden-node");

    const accountRecordMatch = SYSTEM_DATABASE.users.find(u => 
        u.dialingCode === countryVal && 
        u.identifierText.toLowerCase() === identifierInput.toLowerCase()
    );

    if (!accountRecordMatch) { 
        errIdNode.innerText = "No registered matching project found.";
        errIdNode.classList.remove("hidden-node"); 
        return;
    }
            
    if (accountRecordMatch.secretKey !== passwordInput) {
        errPassNode.innerText = "Incorrect Password."; 
        errPassNode.classList.remove("hidden-node");
        return;
    }

    if (document.getElementById("chk-signin-rememberme").checked) { 
        localStorage.setItem("fort_mart_remembered_user", JSON.stringify({
            uid: accountRecordMatch.uid,
            identifierText: accountRecordMatch.identifierText,
            timestamp: Date.now()
        })); 
    } else {
        localStorage.removeItem("fort_mart_remembered_user");
    }

    finalizeAuthSuccess(accountRecordMatch);
}

// ONE-STEP SIGN UP UTILITY FLOW 
function renderSignUpFormLayout() {
    const wrapperTargetNode = document.getElementById("auth-modal-content");
    wrapperTargetNode.innerHTML = `
        <h2>Register a Project</h2>
        <div class="form-input-container margin-top-sm">
            <label>Select Location Dialing Code Line Country:</label>
            <select id="reg-country" class="form-field-control">
                <option value="Nigeria|+234" selected>Nigeria (+234)</option>
                <option value="Ghana|+233">Ghana (+233)</option>
            </select> 
        </div>
        <div class="form-input-container">
            <label>Project Name (Identifier Text)</label>
            <input type="text" id="reg-identifier" class="form-field-control" placeholder="Enter unique project name"> 
        </div>
        <div class="form-input-container">
            <label>Your Full Name</label>
            <input type="text" id="reg-name" class="form-field-control" placeholder="Enter your full name"> 
        </div>
        <div class="form-input-container">
            <label>WhatsApp Number</label>
            <input type="text" id="reg-whatsapp" class="form-field-control" placeholder="Enter active WhatsApp number"> 
        </div>
        <div class="form-input-container">
            <label>Desired Password</label>
            <input type="password" id="reg-pass1" class="form-field-control" placeholder="Create password">
        </div>
        <div class="form-input-container">
            <label>Confirm Password Alignment</label>
            <input type="password" id="reg-pass2" class="form-field-control" placeholder="Re-type password">
            <div class="margin-top-xs">
                <input type="checkbox" id="chk-reg-show" onchange="toggleFieldVisibilityChainSignUp()">
                <label for="chk-reg-show">Show Passwords</label>
            </div>
            <div id="err-reg-feedback" class="text-danger-alert hidden-node"></div>
        </div>
        <div class="btn-group margin-top-md" style="display:flex; gap:10px;">
            <button onclick="renderInitialGatekeeperModal()" class="btn-gray" style="flex:1;">Back</button>
            <button onclick="executeSingleStepRegistration()" class="btn-blue" style="flex:1;">Register</button>
        </div>
    `; 
}
function toggleFieldVisibilityChainSignUp() {
    const status = document.getElementById("chk-reg-show").checked;
    document.getElementById("reg-pass1").type = status ? "text" : "password";
    document.getElementById("reg-pass2").type = status ? "text" : "password";
}

function executeSingleStepRegistration() {
    const countryRaw = document.getElementById("reg-country").value.split("|");
    const identifier = document.getElementById("reg-identifier").value.trim();
    const fullName = document.getElementById("reg-name").value.trim();
    const whatsapp = document.getElementById("reg-whatsapp").value.trim();
    const p1 = document.getElementById("reg-pass1").value;
    const p2 = document.getElementById("reg-pass2").value;
    const errBox = document.getElementById("err-reg-feedback");

    errBox.classList.add("hidden-node");

    if (!identifier || !fullName || !whatsapp || !p1 || !p2) {
        errBox.innerText = "All fields are strictly compulsory.";
        errBox.classList.remove("hidden-node");
        return;
    }

    if (p1 !== p2) {
        errBox.innerText = "Password inputs mismatch configuration details.";
        errBox.classList.remove("hidden-node");
        return;
    }

    // Strong Security Verification Rules Check Line
    const checkRules = /[A-Z]/.test(p1) && /[a-z]/.test(p1) && /[0-9]/.test(p1) && /[^A-Za-z0-9]/.test(p1) && p1.length >= 6;
    if (!checkRules) {
        errBox.innerText = "Password requirements: At least 6 characters, including 1 uppercase, 1 lowercase, 1 digit, and 1 symbol.";
        errBox.classList.remove("hidden-node");
        return;
    }

    const duplicate = SYSTEM_DATABASE.users.find(u => u.dialingCode === countryRaw[1] && u.identifierText.toLowerCase() === identifier.toLowerCase());
    if (duplicate) {
        errBox.innerText = "Project name already exists within this user layout parameters.";
        errBox.classList.remove("hidden-node");
        return;
    }

    // Direct Persistence Structure Object Mapping (No verification challenge loop step) 
    const newUser = {
        uid: "proj_" + Date.now(), 
        identifierText: identifier,
        identityName: fullName,
        whatsappNumber: whatsapp,
        dialingCode: countryRaw[1],
        secretKey: p1,
        projectData: { name: identifier, layouts: "", features: "", linkedTemplates: [], linkedFiles: [] }
    };

    SYSTEM_DATABASE.users.push(newUser);
    localStorage.setItem("SYSTEM_DATABASE", JSON.stringify(window.SYSTEM_DATABASE));

    finalizeAuthSuccess(newUser);
}

function toggleFieldVisibility(targetId, checkbox) {
    document.getElementById(targetId).type = checkbox.checked ? "text" : "password";
}

function finalizeAuthSuccess(userRecord) {
    APP_STATE.currentUser = userRecord;
    document.getElementById("auth-modal").classList.remove("active");
            
    // Read or provision operational internal instance project sandbox layout bucket safely
    if (!userRecord.projectData) {
        userRecord.projectData = { name: userRecord.identifierText, layouts: "", features: "", linkedTemplates: [], linkedFiles: [] };
    }
    APP_STATE.currentProject = userRecord.projectData;

    renderWorkspaceMainView();
}

function renderWorkspaceMainView() {
    document.getElementById("main-workspace").classList.remove("hidden-node"); 
            
    document.getElementById("ws-name").value = APP_STATE.currentProject.name || "";
    document.getElementById("ws-layouts").value = APP_STATE.currentProject.layouts || "";
    document.getElementById("ws-features").value = APP_STATE.currentProject.features || "";
            
    renderAssetGridContainers();
}

function renderAssetGridContainers() {
    const templatesBox = document.getElementById("linked-templates-box");
    const filesBox = document.getElementById("linked-files-box");

    templatesBox.innerHTML = APP_STATE.currentProject.linkedTemplates.length === 0 ? '<p style="color:gray; font-size:0.9rem;">No templates linked yet.</p>' : '';
    filesBox.innerHTML = APP_STATE.currentProject.linkedFiles.length === 0 ? '<p style="color:gray; font-size:0.9rem;">No files attached yet.</p>' : '';

    APP_STATE.currentProject.linkedTemplates.forEach(t => {
        const div = document.createElement("div");
        div.className = "asset-item";
        div.innerHTML = `<strong>${t.name}</strong><span style="font-size:0.75rem; color:gray;">ID: ${t.id}</span>`; 
        div.onclick = () => openExpandedAssetModal('template', t.id); 
        templatesBox.appendChild(div);
    });

    APP_STATE.currentProject.linkedFiles.forEach(f => {
        const div = document.createElement("div");
        div.className = "asset-item";
        div.innerHTML = `<strong>${f.name}</strong><span style="font-size:0.75rem; color:gray;">Type: ${f.type.toUpperCase()}</span>`; 
        div.onclick = () => openExpandedAssetModal('file', f.id); 
        filesBox.appendChild(div);
    });
}

function saveCurrentWorkspaceData(alertUser = false) {
    APP_STATE.currentProject.name = document.getElementById("ws-name").value.trim();
    APP_STATE.currentProject.layouts = document.getElementById("ws-layouts").value.trim();
    APP_STATE.currentProject.features = document.getElementById("ws-features").value.trim(); 

    // Synchronize reference contexts layers cleanly downstream inside global structural array collections
    const userIndex = SYSTEM_DATABASE.users.findIndex(u => u.uid === APP_STATE.currentUser.uid);
    if (userIndex !== -1) {
        SYSTEM_DATABASE.users[userIndex].projectData = APP_STATE.currentProject;
        localStorage.setItem("SYSTEM_DATABASE", JSON.stringify(window.SYSTEM_DATABASE));
    }

    if (alertUser) alert("Workspace system changes written down securely.");
}

// CHOOSE TEMPLATE MODAL FLOW 
// Dedicated static runtime source for templates to prevent database sync issues
// Dedicated static runtime source for templates to prevent database sync issues 
const HARDCODED_TEMPLATES_ARRAY = [
    { 
        id: "tmpl_001", 
        name: "E-Commerce Basic", 
        category: "Retail", 
        description: "Clean grid layout with minimal shopping cart utilities.", 
        images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500"] 
    },
    { 
        id: "tmpl_002", 
        name: "Creative Agency Portfolio", 
        category: "Corporate", 
        description: "Bespoke look targeted toward digital agencies.", 
        images: ["https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500"] 
    },
    { 
        id: "tmpl_003", 
        name: "SaaS Application Landing Page", 
        category: "Tech", 
        description: "High converting dark layout showcasing technical copy fields.", 
        images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500"] 
    },
    { 
        id: "tmpl_004", 
        name: "Fort", 
        category: "Tech", 
        description: "A website advertising Fort", 
        images: ["tmpl_004_1.png", "tmpl_004_2.png", "tmpl_004_3.png", "tmpl_004_4.png"] 
    }
];

function openTemplateSelectorModal() {
    const overlay = document.getElementById("secondary-modal");
    const content = document.getElementById("secondary-modal-content");
    overlay.classList.add("active"); 
    content.className = "modal-box modal-box-large";

    content.innerHTML = `
        <h3>Choose a Website Design Framework Template</h3>
        <div class="form-input-container margin-top-sm">
            <input type="text" id="tmpl-search-bar" class="form-field-control" placeholder="Search templates by ID, Name or Scope description details..." oninput="filterTemplateGalleryView()">
        </div>
        <div id="tmpl-gallery-target" class="template-gallery"></div>
        <div class="margin-top-md text-center">
            <button class="btn-gray" onclick="closeSecondaryOverlayModal()">Close</button>
        </div>
    `; 
    filterTemplateGalleryView(); 
}

function filterTemplateGalleryView() {
    const query = document.getElementById("tmpl-search-bar").value.toLowerCase(); 
    const target = document.getElementById("tmpl-gallery-target"); 
    target.innerHTML = ''; 

    const matches = HARDCODED_TEMPLATES_ARRAY.filter(t => 
        t.id.toLowerCase().includes(query) || 
        t.name.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query)
    ); 

    matches.forEach(t => {
        const card = document.createElement("div"); 
        card.className = "template-card"; 
        
        // Displays only one picture in the non-expanded view layout gallery 
        const initialDisplayImage = (t.images && t.images.length > 0) ? t.images[0] : ''; 

        card.innerHTML = `
            <img src="${initialDisplayImage}" alt="${t.name}">
            <div class="template-card-body">
                <h4>${t.name}</h4>
                <p style="font-size:0.8rem; color:gray; margin-top:4px;">${t.description.substring(0, 60)}...</p>
            </div>
        `; 
        card.onclick = () => openExpandedTemplateDetailsView(t); 
        target.appendChild(card); 
    });
}

function openExpandedTemplateDetailsView(templateObj) {
    const content = document.getElementById("secondary-modal-content"); 
    
    // Generates equivalent individual picture containers for every image in expanded view
    let imagesContainerHTML = '<div class="expanded-images-grid" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px;">'; 
    if (templateObj.images && templateObj.images.length > 0) {
        templateObj.images.forEach((imgSrc, idx) => {
            imagesContainerHTML += `
                <div class="expanded-image-wrapper" style="width: 100%; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden;">
                    <img src="${imgSrc}" style="width: 100%; height: auto; display: block; object-fit: contain;" alt="Template Image ${idx + 1}">
                </div>
            `;
        });
    }
    imagesContainerHTML += '</div>';

    content.innerHTML = `
        <h3>${templateObj.name}</h3>
        <p style="color:var(--fort-gray-slate); font-size:0.85rem; margin-bottom:10px;">Template Infrastructure Identification Key Reference: ${templateObj.id}</p>
        
        ${imagesContainerHTML}
        
        <p class="margin-top-sm" style="line-height:1.5;">${templateObj.description}</p>
        <div class="btn-group margin-top-md" style="display:flex; gap:10px;">
            <button class="btn-gray" onclick="openTemplateSelectorModal()" style="flex:1;">Back to Gallery</button>
            <button class="btn-blue" onclick="linkTemplateToCurrentProject('${templateObj.id}', '${templateObj.name}')" style="flex:1;">Choose Template</button>
        </div>
    `; 
}

function linkTemplateToCurrentProject(id, name) {
    if (!APP_STATE.currentProject.linkedTemplates.some(t => t.id === id)) {
        APP_STATE.currentProject.linkedTemplates.push({ id, name }); 
        saveCurrentWorkspaceData(); 
        renderAssetGridContainers(); 
    }
    closeSecondaryOverlayModal(); 
}

// Global modal window termination action to fix unclickable/broken cancel loops 
function closeSecondaryOverlayModal() {
    const overlay = document.getElementById("secondary-modal");
    if (overlay) {
        overlay.classList.remove("active");
    }
}

// FLOATING ACTION ATTACH FILE MODAL FLOW 
function openFileUploadModal() {
    const overlay = document.getElementById("secondary-modal");
    const content = document.getElementById("secondary-modal-content");
    overlay.classList.add("active");
    content.className = "modal-box";

    content.innerHTML = `
        <h3>Attach Workspace File Asset</h3>
        <div class="form-input-container margin-top-sm">
            <label>Choose File Resource Pipeline</label>
            <input type="file" id="asset-file-picker" class="form-field-control" onchange="handleFileSelectionPreviewChange(this)">
        </div>
        <div class="form-input-container">
            <label>Filename Identification Text Tag Override</label>
            <input type="text" id="asset-filename-input" class="form-field-control"> 
        </div>
        <div id="file-preview-window" class="preview-box">
            <span style="color:gray; font-size:0.9rem;">No active asset data loaded yet</span>
        </div>
        <div class="btn-group margin-top-md" style="display:flex; gap:10px;">
            <button class="btn-gray" onclick="closeSecondaryOverlayModal()" style="flex:1;">Cancel</button>
            <button class="btn-blue" onclick="commitAttachedAssetFileToWorkspace()" style="flex:1;">Choose</button> 
        </div>
    `;
}

let CURRENTLY_PROCESSING_FILE_DATA = null;

function handleFileSelectionPreviewChange(inputNode) {
    const file = inputNode.files[0];
    if (!file) return;

    document.getElementById("asset-filename-input").value = file.name; 
    const previewBox = document.getElementById("file-preview-window");
    previewBox.innerHTML = '';

    const reader = new FileReader();
            
    if (file.type.startsWith("image/")) {
        reader.onload = (e) => {
            previewBox.innerHTML = `<img src="${e.target.result}" />`;
            CURRENTLY_PROCESSING_FILE_DATA = { name: file.name, type: 'image', raw: e.target.result };
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
        reader.onload = (e) => {
            previewBox.innerHTML = `<video src="${e.target.result}" controls autoplay muted></video>`;
            CURRENTLY_PROCESSING_FILE_DATA = { name: file.name, type: 'video', raw: e.target.result };
        };
        reader.readAsDataURL(file);
    } else {
        // File handling generic icon system implementation 
        previewBox.innerHTML = `
            <div style="text-align:center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                <p style="font-size:0.8rem; margin-top:5px; color:gray;">${file.type || 'Binary Document'}</p>
            </div>`;
        reader.onload = (e) => {
            CURRENTLY_PROCESSING_FILE_DATA = { name: file.name, type: 'file', raw: e.target.result };
        };
        reader.readAsDataURL(file);
    }
}

function commitAttachedAssetFileToWorkspace() {
    if (!CURRENTLY_PROCESSING_FILE_DATA) {
        alert("Please click select structural resource file references first.");
        return;
    }
    const structuralCustomOverrideName = document.getElementById("asset-filename-input").value.trim();
    if (structuralCustomOverrideName) {
        CURRENTLY_PROCESSING_FILE_DATA.name = structuralCustomOverrideName;
    }

    CURRENTLY_PROCESSING_FILE_DATA.id = "file_" + Date.now();
    APP_STATE.currentProject.linkedFiles.push(CURRENTLY_PROCESSING_FILE_DATA);
            
    saveCurrentWorkspaceData();
    renderAssetGridContainers();
    closeSecondaryOverlayModal();
    CURRENTLY_PROCESSING_FILE_DATA = null;
}

// EXPANDED ASSET VIEW AND DISMISSAL MODAL LOOP 
function openExpandedAssetModal(assetType, assetId) {
    const overlay = document.getElementById("secondary-modal");
    const content = document.getElementById("secondary-modal-content");
    overlay.classList.add("active");
    content.className = "modal-box";

    if (assetType === 'template') {
        const item = APP_STATE.currentProject.linkedTemplates.find(t => t.id === assetId);
        content.innerHTML = `
            <h3>Linked Structural Design</h3>
            <p class="margin-top-sm"><strong>Name:</strong> ${item.name}</p>
            <p><strong>Database Key Identifier:</strong> ${item.id}</p>
            <div class="btn-group margin-top-md" style="display:flex; gap:10px;">
                <button class="btn-gray" onclick="closeSecondaryOverlayModal()" style="flex:1;">Close</button>
                <button class="btn-red" onclick="removeAssetConfirmed('${assetType}', '${assetId}')" style="flex:1;">Remove Connection</button>
            </div>
        `;
    } else {
        const item = APP_STATE.currentProject.linkedFiles.find(f => f.id === assetId);
        let visualNodeBlock = `<div class="preview-box">No visualization metrics accessible</div>`;
        if (item.type === 'image') visualNodeBlock = `<img src="${item.raw}" style="max-width:100%; max-height:200px; object-fit:contain;" />`;
        if (item.type === 'video') visualNodeBlock = `<video src="${item.raw}" style="max-width:100%; max-height:200px;" controls></video>`;

        content.innerHTML = `
            <h3>Linked File Resource</h3>
            <p class="margin-top-sm"><strong>Filename Tag:</strong> ${item.name}</p>
            <div style="margin: 15px 0;">${visualNodeBlock}</div>
            <div class="btn-group margin-top-md" style="display:flex; gap:10px;">
                <button class="btn-gray" onclick="closeSecondaryOverlayModal()" style="flex:1;">Close</button>
                <button class="btn-red" onclick="removeAssetConfirmed('${assetType}', '${assetId}')" style="flex:1;">Remove File</button>
            </div>
        `;
    }
}

function removeAssetConfirmed(type, id) {
    if (!confirm("Are you absolutely sure you want to decouple this asset?")) return; 

    if (type === 'template') {
        APP_STATE.currentProject.linkedTemplates = APP_STATE.currentProject.linkedTemplates.filter(t => t.id !== id);
    } else {
        APP_STATE.currentProject.linkedFiles = APP_STATE.currentProject.linkedFiles.filter(f => f.id !== id);
    }

    saveCurrentWorkspaceData();
    renderAssetGridContainers();
    closeSecondaryOverlayModal();
}

// CONFIRMED DELETION THROUGH PASSWORD CHALLENGE
function promptProjectDeletionFlow() {
    const overlay = document.getElementById("secondary-modal");
    const content = document.getElementById("secondary-modal-content");
    overlay.classList.add("active");
    content.className = "modal-box";

    content.innerHTML = `
        <h3 style="color:var(--danger-red);">Danger: Purge Workspace Scope Data</h3>
        <p class="margin-top-sm" style="font-size:0.9rem;">To completely delete this configuration data block workspace, verify ownership validation rules parameters by entering your security access password token credentials key link:</p>
        <div class="form-input-container margin-top-sm">
            <input type="password" id="purge-challenge-pass" class="form-field-control" placeholder="Enter confirmation password verification string">
        </div>
        <div id="err-purge-msg" class="text-danger-alert hidden-node"></div>
        <div class="btn-group margin-top-md" style="display:flex; gap:10px;">
            <button class="btn-gray" onclick="closeSecondaryOverlayModal()" style="flex:1;">Abort</button>
            <button class="btn-red" onclick="executePurgeWorkspaceSequence()" style="flex:1;">Confirm Purge</button>
        </div>
    `; 
}

function executePurgeWorkspaceSequence() {
    const passValue = document.getElementById("purge-challenge-pass").value;
    const errBox = document.getElementById("err-purge-msg");
    errBox.classList.add("hidden-node");

    if (passValue !== APP_STATE.currentUser.secretKey) {
        errBox.innerText = "Security Validation Verification Error: Incorrect Password Matching Entry.";
        errBox.classList.remove("hidden-node");
        return;
    }

    // Remove project and clear fields completely
    APP_STATE.currentProject = { id: null, name: "", layouts: "", features: "", linkedTemplates: [], linkedFiles: [] };
    const userIndex = SYSTEM_DATABASE.users.findIndex(u => u.uid === APP_STATE.currentUser.uid);
    if (userIndex !== -1) {
        SYSTEM_DATABASE.users[userIndex].projectData = APP_STATE.currentProject;
        localStorage.setItem("SYSTEM_DATABASE", JSON.stringify(window.SYSTEM_DATABASE));
    }

    closeSecondaryOverlayModal();
    alert("Workspace resource data completely stripped from system registers.");
    renderWorkspaceMainView();
}

// =========================================================================
// EMAILJS PIPELINE ENGINE UTILITY LINK & IDENTITY VERIFICATION SUBSYSTEM
// =========================================================================

/**
 * Initiates the project submission pipeline by opening an identity 
 * verification modal requesting user email and password keys.
 */
function sendProjectToFortDevelopers() {
    // Save workspace data before triggering validation views
    saveCurrentWorkspaceData();

    const overlay = document.getElementById("secondary-modal");
    const content = document.getElementById("secondary-modal-content");
    
    if (!overlay || !content) return;

    overlay.classList.add("active");
    content.className = "modal-box";

    content.innerHTML = `
        <h3>Verify Your Identity</h3>
        <p style="font-size: 0.85rem; color: #e63946; margin-top: 5px; font-weight: bold;">
            Enter your valid email address, if your email is recieved a confirmation email will be sent to the address.
        </p>
        <div class="form-input-container margin-top-sm" style="display: flex; flex-direction: column; gap: 10px;">
            <input type="email" id="verification-email" class="form-field-control" placeholder="Enter valid email address..." required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            <input type="password" id="verification-password" class="form-field-control" placeholder="Enter password..." required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            
            <!-- Hidden node placeholder container for authentication tracking errors -->
            <p id="password-error-node" style="display: none; color: #e63946; font-size: 0.8rem; margin: 0; font-weight: bold;">Incorrect password.</p>
        </div>
        <div class="btn-group margin-top-md" style="display: flex; gap: 10px;">
            <button class="btn-gray" onclick="closeSecondaryOverlayModal()" style="flex: 1;">Cancel</button>
            <button class="btn-blue" onclick="processVerifiedProjectSubmission()" style="flex: 1;">Confirm Sending</button>
        </div>
    `;
}

/**
 * Validates inputs, checks credentials, constructs text formatting templates,
 * and handles multi-template dispatch sequencing protocols.
 */
function processVerifiedProjectSubmission() {
    const inputEmail = document.getElementById("verification-email").value.trim();
    const inputPassword = document.getElementById("verification-password").value.trim();
    const errorNode = document.getElementById("password-error-node");

    if (!inputEmail || !inputPassword) {
        alert("Please fill out both your email and password fields before continuing.");
        return;
    }

    // Validate if the inputted credential matches the active state profile key
    const currentRegisteredPassword = APP_STATE.currentUser.password || "";
    if (inputPassword !== currentRegisteredPassword) {
        if (errorNode) {
            errorNode.style.display = "block"; // Displays the hidden incorrect password node alert
        }
        return;
    }

    // Hide error node if verification succeeds
    if (errorNode) {
        errorNode.style.display = "none";
    }

    const projectOwnerName = APP_STATE.currentUser.identityName || "Developer Profile User";
    const dialCode = APP_STATE.currentUser.dialingCode || "234";
    const whatsappNumber = APP_STATE.currentUser.whatsappNumber || "";
    const websiteName = APP_STATE.currentProject.name || "Unspecified Workspace Template Title";
    const websiteLayout = APP_STATE.currentProject.layouts || "No explicit structural outlines logged.";
    const websiteFeatures = APP_STATE.currentProject.features || "No feature criteria defined.";

    const templateIdsAttached = APP_STATE.currentProject.linkedTemplates.map(t => t.id).join(", ") || "None Linked";

    // Text Template String Layout includes input verification email in the body
    const formattedEmailMessageBodyContent = `
Hi Fort Developers, I am ${projectOwnerName},
My email address is: ${inputEmail}
My whatsapp number is +${dialCode}${whatsappNumber}

I need you to create a website for me named ${websiteName}.
This is my layout;
${websiteLayout}

These are the features;
${websiteFeatures}

All my files needed are attached to the message. Linked Framework Design Template IDs: [${templateIdsAttached}].
Thanks.
    `;

    // Consolidated variables dataset parameter map passing explicit routing definitions
    const emailJsPayloadVariablesParameters = {
        to_email: "fortdevelopers492@gmail.com",
        from_name: projectOwnerName,
        project_name: websiteName,
        message: formattedEmailMessageBodyContent,
        user_email: inputEmail // Explicit key argument mapped to route dashboard auto-replies
    };

    // Close security validation view state to prepare next status message
    closeSecondaryOverlayModal();

    // Template 1 Dispatch Chain Execution
    emailjs.send("service_ejag5pe", "template_zplwktm", emailJsPayloadVariablesParameters)
        .then(() => {
            // Template 2 Dispatch Chain Execution (Fires auto-reply routing payload)
            return emailjs.send("service_ejag5pe", "template_9lerger", emailJsPayloadVariablesParameters);
        })
        .then(() => {
            // Displays success UI prompt modal only if operations pass seamlessly without faults
            promptWhatsAppManualFilesSubmissionModal();
        })
        .catch((error) => {
            console.error("Transmission interruption dropped connection:", error);
            // Render an explicit failure message layout instead of displaying the WhatsApp prompt modal
            promptEmailTransmissionFailureModal(error);
        });
}

/**
 * Generates an alternative overlay dashboard warning card block when transfers encounter fatal interruptions.
 */
function promptEmailTransmissionFailureModal(errorDetails) {
    const overlay = document.getElementById("secondary-modal");
    const content = document.getElementById("secondary-modal-content");
    if (!overlay || !content) return;

    overlay.classList.add("active");
    content.className = "modal-box";

    content.innerHTML = `
        <h3 style="color: #e63946;">Submission Failed</h3>
        <p class="margin-top-sm" style="line-height: 1.5; color: var(--dark-charcoal);">
            Your request could not be sent. Please check your network connection and try again.
        </p>
        <p style="font-size: 0.75rem; color: gray; margin-top: 5px; font-family: monospace;">
            Error Details: ${errorDetails?.text || errorDetails?.message || "Unknown error context"}
        </p>
        <div class="btn-group margin-top-md">
            <button class="btn-gray" style="width: 100%;" onclick="closeSecondaryOverlayModal()">Close</button>
        </div>
    `;
}

/**
 * Renders the WhatsApp document asset notification overlay modal view card framework block.
 */
function promptWhatsAppManualFilesSubmissionModal() {
    const overlay = document.getElementById("secondary-modal");
    const content = document.getElementById("secondary-modal-content");
    if (!overlay || !content) return;

    overlay.classList.add("active");
    content.className = "modal-box";

    content.innerHTML = `
        <h3>Email Forwarded Successfully</h3>
        <p class="margin-top-sm" style="line-height: 1.5; color: var(--dark-charcoal);">
            Please send the files manually on WhatsApp to complete your design configuration manifest submission sequence.
        </p>
        <div class="btn-group margin-top-md">
            <button class="btn-blue" style="width: 100%; background-color: #25D366;" onclick="executeWhatsAppRedirectionRedirect()">Send</button>
        </div>
    `;
}

/**
 * Compiles a deep link redirection string mapping the required WhatsApp messaging layout template configurations.
 */
function executeWhatsAppRedirectionRedirect() {
    const defaultSupportLineNumber = "2348028241162"; // Nigeria (+234) 08028241162 pipeline target
    const targetPrewrittenMessageText = "I've sent my instructions via email this are my files.";
    
    const secureEncodedUrlPipelineString = `https://wa.me/${defaultSupportLineNumber}?text=${encodeURIComponent(targetPrewrittenMessageText)}`;
    
    window.open(secureEncodedUrlPipelineString, "_blank");
    closeSecondaryOverlayModal();
}

/**
 * Universal dismiss helper action used to wipe target active overlay tags.
 */
function closeSecondaryOverlayModal() {
    const overlay = document.getElementById("secondary-modal");
    if (overlay) {
        overlay.classList.remove("active");
    }
}

