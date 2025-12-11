import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Search,
  Folder,
  Lock,
  LogOut,
} from "lucide-react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("auth") === "true"
  );
  const [password, setPassword] = useState("");
  const [presentations, setPresentations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // ❗ CHANGE THIS TO YOUR REAL RAILWAY BACKEND URL
  const API_URL = "https://diplomatic-harmony-production-66e6.up.railway.app";

  useEffect(() => {
    if (isAuthenticated) {
      loadPresentations();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("auth", "true");
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      setError("Connection error. Make sure backend is running.");
    }
  };

  const loadPresentations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/presentations`);
      const data = await response.json();
      setPresentations(data.files || []);
    } catch (err) {
      setError("Failed to load presentations");
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 100MB.`);
        continue;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          await loadPresentations();
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      } catch (err) {
        alert(`Error uploading ${file.name}`);
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  const deletePresentation = async (filename) => {
    if (!window.confirm("Delete this presentation?")) return;

    try {
      const response = await fetch(`${API_URL}/delete/${filename}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) loadPresentations();
      else alert("Failed to delete");
    } catch (err) {
      alert("Error deleting file");
    }
  };

  const downloadPresentation = (name) => {
    window.open(`${API_URL}/download/${name}`, "_blank");
  };

  const viewPresentation = (name) => {
    window.open(`${API_URL}/download/${name}`, "_blank");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return isAuthenticated ? (
    <MainApp
      presentations={presentations}
      loading={loading}
      filter={filter}
      setFilter={setFilter}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      uploading={uploading}
      viewPresentation={viewPresentation}
      downloadPresentation={downloadPresentation}
      deletePresentation={deletePresentation}
      handleFileUpload={handleFileUpload}
      formatFileSize={formatFileSize}
      logout={() => {
        sessionStorage.removeItem("auth");
        setIsAuthenticated(false);
      }}
    />
  ) : (
    <LoginScreen
      password={password}
      setPassword={setPassword}
      handleLogin={handleLogin}
      error={error}
    />
  );
}

function LoginScreen({ password, setPassword, handleLogin, error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Lock size={50} className="mx-auto text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800 mt-3">
            Presentation Manager
          </h1>
          <p className="text-gray-600">Enter password to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg mb-4"
            placeholder="Password"
          />

          {error && (
            <div className="text-red-600 bg-red-100 p-2 rounded mb-3">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function MainApp({
  presentations,
  loading,
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  uploading,
  viewPresentation,
  downloadPresentation,
  deletePresentation,
  handleFileUpload,
  formatFileSize,
  logout,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex justify-between">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Folder className="text-indigo-600" />
              My Presentations
            </h1>

            <button
              onClick={logout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <label className="block mt-6">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed p-6 rounded-xl text-center cursor-pointer">
              <Upload className="mx-auto text-indigo-600" size={40} />
              <p className="text-lg mt-2">
                {uploading ? "Uploading..." : "Click to upload files"}
              </p>
            </div>
          </label>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-lg"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 border rounded-lg"
            >
              <option value="all">All</option>
              <option value="presentation">PPT</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p>Loading...</p>
          ) : presentations.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            presentations.map((p) => (
              <div
                key={p.name}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <FileText className="text-indigo-600" size={40} />

                <h3 className="font-semibold mt-3 truncate">{p.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(p.size)}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => viewPresentation(p.name)}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg"
                  >
                    <Eye size={16} /> View
                  </button>

                  <button
                    onClick={() => downloadPresentation(p.name)}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg"
                  >
                    <Download size={16} /> Download
                  </button>

                  <button
                    onClick={() => deletePresentation(p.name)}
                    className="bg-red-500 text-white p-2 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

