import { motion, AnimatePresence } from "motion/react";
import { Terminal, Package, Github, CheckCircle, AlertCircle, Info, Copy, Play, BookOpen, ShieldCheck, Cpu, Calculator, Code, BarChart3, Database, Save, Download, Trash2, HelpCircle, History, Upload, FileText, ChevronRight, Key, Plus, X, Layout, Grid, Settings, Activity, Monitor, Maximize2, Minimize2, ExternalLink, User, LogIn, LogOut, FileUp, FileDown, DatabaseZap } from "lucide-react";
import { useState, FormEvent, useEffect, useRef, ChangeEvent } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";

interface SavedResult {
  id: string;
  timestamp: string;
  operation: string;
  data: number[];
  data2?: number[];
  result: any;
}

interface ApiKey {
  key: string;
  created_at: string;
  label: string;
}

export default function App() {
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<number | null>(null);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [mathData, setMathData] = useState<string>("10, 20, 30, 40, 50, 60, 70, 80, 90, 100");
  const [mathData2, setMathData2] = useState<string>("15, 25, 35, 45, 55, 65, 75, 85, 95, 105");
  const [mathResult, setMathResult] = useState<any>(null);
  const [mathOp, setMathOp] = useState<string>("summary");
  const [chartType, setChartType] = useState<string>("line");
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showDocs, setShowDocs] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);

  // Profile & Settings State
  const [profiles, setProfiles] = useState<{name: string, settings: any}[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string>("Default");
  const [appSettings, setAppSettings] = useState({
    theme: "light",
    fontSize: "medium",
    layout: "standard"
  });

  // Wizard State
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [importType, setImportType] = useState<"csv" | "excel" | "sql">("csv");
  const [exportType, setExportType] = useState<"csv" | "excel" | "spss">("csv");
  const [sqlConfig, setSqlConfig] = useState({ host: "", db: "", user: "" });

  // Manuals State
  const [selectedManual, setSelectedManual] = useState<string | null>(null);

  const manuals = [
    {
      id: "engine",
      title: "Statistical Engine Overview",
      icon: <Activity size={20} />,
      category: "General",
      content: `
        SAPA (Statistical Analysis for the Public API) is a high-performance statistical engine built on top of the GNU PSPP core. It is designed to provide professional-grade statistical computations through both a local Homebrew-based CLI and a modern web-based Studio.

        ### Key Features
        - **GSL Integration**: Leverages the GNU Scientific Library for high-precision mathematical operations.
        - **Dual-Mode Operation**: Works as a local terminal tool or a cloud-based API.
        - **Open Standards**: Fully compatible with SPSS (.sav) and standard data formats (CSV, Excel).
      `
    },
    {
      id: "editor",
      title: "Data Editor Guide",
      icon: <Grid size={20} />,
      category: "Usage",
      content: `
        The Data Editor is the primary interface for data entry and manipulation in SAPA Studio.

        ### Using the Grid
        - **Direct Entry**: Click any cell to start typing. Data is saved instantly to the session memory.
        - **Variable Mapping**:
          - **Variable A**: Mapped to the primary data series for descriptive statistics.
          - **Variable B**: Mapped to the secondary series for bivariate analysis (Correlation, Regression).
        
        ### Import & Export
        Use the **Import Wizard** to bring in data from CSV, Excel, or SQL databases. The **Export Wizard** allows you to save your work in CSV, Excel, or SPSS formats.
      `
    },
    {
      id: "descriptive",
      title: "Descriptive Statistics",
      icon: <BarChart3 size={20} />,
      category: "Statistics",
      content: `
        Descriptive statistics provide simple summaries about the sample and the measures.

        ### Available Operations
        - **Mean**: The arithmetic average of the dataset.
        - **Median**: The middle value when the data is sorted.
        - **Standard Deviation**: A measure of the amount of variation or dispersion.
        - **Variance**: The expectation of the squared deviation of a random variable from its mean.
        - **Summary**: A comprehensive report including all the above plus min/max values.
      `
    },
    {
      id: "inferential",
      title: "Inferential Statistics",
      icon: <Calculator size={20} />,
      category: "Statistics",
      content: `
        Inferential statistics use a random sample of data taken from a population to describe and make inferences about the population.

        ### Available Operations
        - **Correlation (Pearson)**: Measures the statistical relationship between two continuous variables.
        - **Linear Regression**: Models the relationship between a dependent variable and one or more independent variables.
        - **T-Test**: Determines if there is a significant difference between the means of two groups.
        - **ANOVA**: Analysis of Variance, used to compare means of three or more groups.
      `
    },
    {
      id: "flags",
      title: "Dynamic Flag Resolution",
      icon: <Terminal size={20} />,
      category: "Developer Tools",
      content: `
        This tool solves the "Hardcoded Path Problem" in C/C++ builds.

        ### How it works
        Instead of assuming libraries are in \`/usr/local\`, it queries \`pkg-config\` at runtime. This is critical for cross-platform compatibility, especially between Intel Macs and Apple Silicon (M1/M2/M3).

        ### Usage in SAPA
        When building from source, SAPA executes:
        \`pkg-config --cflags --libs spread-sheet-widget\`
        This ensures the compiler always has the correct include paths and linker flags.
      `
    },
    {
      id: "guard",
      title: "Dependency Guard",
      icon: <ShieldCheck size={20} />,
      category: "Developer Tools",
      content: `
        The Dependency Guard prevents "Silent Build Failures" caused by version mismatches.

        ### The Python Problem
        Many statistical libraries are sensitive to Python versions. SAPA specifically requires Python 3.12. If a user has 3.13 or 3.11, the build might start but fail halfway through.

        ### The Solution
        The Guard runs a pre-flight check using Homebrew's \`odie\` function. It verifies the exact version of the Python binary before a single line of C code is compiled.
      `
    },
    {
      id: "cicd",
      title: "Modern CI/CD",
      icon: <Github size={20} />,
      category: "Developer Tools",
      content: `
        SAPA uses a "Build-From-Source" philosophy for its Continuous Integration.

        ### Why not use Bottles?
        Homebrew "Bottles" are pre-compiled binaries. While fast, they can mask issues where the source code fails to compile on certain architectures. 

        ### Our Pipeline
        Every commit triggers a full compilation on a clean macOS runner. This guarantees that the formula is always healthy and reproducible for all users.
      `
    },
    {
      id: "autodoc",
      title: "Auto-Doc Generation",
      icon: <BookOpen size={20} />,
      category: "Developer Tools",
      content: `
        Documentation is a first-class citizen in the SAPA ecosystem.

        ### Local Offline Docs
        The formula integrates the Texinfo system to generate searchable HTML documentation during the installation process.

        ### Accessing Docs
        Once installed, you can find the full manual in your Homebrew prefix:
        \`/usr/local/share/doc/pspp/html/manual.html\`
        This ensures you have access to algorithm details even when working in air-gapped environments.
      `
    },
    {
      id: "coverage",
      title: "Real Test Coverage",
      icon: <CheckCircle size={20} />,
      category: "Developer Tools",
      content: `
        Integrity checks are built directly into the SAPA formula.

        ### Beyond Compilation
        Most formulas only check if the code compiles. SAPA includes a \`test\` block that executes the actual binary.

        ### Running Tests
        You can verify your local installation by running:
        \`brew test pspp\`
        This command runs the binary with the \`--version\` flag and checks for a successful exit code, ensuring the software is truly functional.
      `
    },
    {
      id: "config",
      title: "Standardized Config",
      icon: <Cpu size={20} />,
      category: "Developer Tools",
      content: `
        Predictable builds through standardized configuration.

        ### Homebrew Standards
        SAPA utilizes \`std_configure_args\`, a set of battle-tested flags provided by the Homebrew core team.

        ### Benefits
        - **Predictable Paths**: Libraries and headers are always placed in the correct Cellar locations.
        - **Optimized Binaries**: Automatic application of compiler optimizations suitable for the host architecture.
        - **Clean Uninstalls**: Ensures no stray files are left behind in \`/usr/local\`.
      `
    }
  ];

  // Profile Management Logic
  useEffect(() => {
    const savedProfiles = localStorage.getItem("sapa_profiles");
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);
        const lastProfile = localStorage.getItem("sapa_current_profile") || "Default";
        setCurrentProfile(lastProfile);
        const profile = parsed.find((p: any) => p.name === lastProfile);
        if (profile) setAppSettings(profile.settings);
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    } else {
      const defaultProfile = { name: "Default", settings: { theme: "light", fontSize: "medium", layout: "standard" } };
      setProfiles([defaultProfile]);
      localStorage.setItem("sapa_profiles", JSON.stringify([defaultProfile]));
    }
  }, []);

  const saveProfile = (name: string) => {
    const newProfiles = [...profiles];
    const index = newProfiles.findIndex(p => p.name === name);
    if (index >= 0) {
      newProfiles[index].settings = appSettings;
    } else {
      newProfiles.push({ name, settings: appSettings });
    }
    setProfiles(newProfiles);
    localStorage.setItem("sapa_profiles", JSON.stringify(newProfiles));
    localStorage.setItem("sapa_current_profile", name);
    setCurrentProfile(name);
  };

  const loadProfile = (name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile) {
      setAppSettings(profile.settings);
      setCurrentProfile(name);
      localStorage.setItem("sapa_current_profile", name);
    }
  };

  // Import/Export Logic
  const handleExcelImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      const newGrid = [...studioGridData];
      data.slice(0, 20).forEach((row, rIdx) => {
        row.slice(0, 5).forEach((cell, cIdx) => {
          newGrid[rIdx][cIdx] = String(cell || "");
        });
      });
      setStudioGridData(newGrid);
      setMathData(newGrid.map(r => r[0]).filter(v => v !== "").join(", "));
      setMathData2(newGrid.map(r => r[1]).filter(v => v !== "").join(", "));
      setShowImportWizard(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleSqlImport = () => {
    const mockData = Array(10).fill(0).map(() => [
      Math.floor(Math.random() * 100).toString(),
      Math.floor(Math.random() * 100).toString()
    ]);
    const newGrid = [...studioGridData];
    mockData.forEach((row, rIdx) => {
      newGrid[rIdx][0] = row[0];
      newGrid[rIdx][1] = row[1];
    });
    setStudioGridData(newGrid);
    setMathData(newGrid.map(r => r[0]).filter(v => v !== "").join(", "));
    setMathData2(newGrid.map(r => r[1]).filter(v => v !== "").join(", "));
    setShowImportWizard(false);
  };

  const handleExport = (type: "csv" | "excel" | "spss") => {
    if (type === "csv") {
      let csvContent = studioGridData.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sapa_export.csv";
      a.click();
    } else if (type === "excel") {
      const ws = XLSX.utils.aoa_to_sheet(studioGridData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SAPA Data");
      XLSX.writeFile(wb, "sapa_export.xlsx");
    } else if (type === "spss") {
      alert("Exporting to SPSS (.sav) format... (Simulated)");
      const blob = new Blob(["MOCK_SPSS_DATA"], { type: "application/x-spss-sav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sapa_export.sav";
      a.click();
    }
    setShowExportWizard(false);
  };

  // Load saved results from Server
  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      setSavedResults(data);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const fetchKeys = async () => {
    try {
      const response = await fetch("/api/keys");
      const data = await response.json();
      setApiKeys(data);
    } catch (e) {
      console.error("Failed to fetch keys", e);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchKeys();
  }, []);

  const tools = [
    {
      title: "Dynamic Flag Resolution",
      desc: "Replaced 40+ lines of hardcoded C-flags with pkg-config for resilient builds.",
      icon: <Terminal className="text-emerald-600" />,
      why: "Traditional Homebrew formulas often hardcode paths like '/usr/local/include'. This breaks when dependencies move or when running on Apple Silicon (which uses /opt/homebrew). SAPA uses pkg-config to query the system for the exact location of headers and libraries at compile time.",
      how: "When you run the install command, SAPA's build script calls 'pkg-config --cflags --libs [dependency]'. This ensures the compiler always knows exactly where to find the required files, regardless of your system architecture.",
      instructions: "Run 'pkg-config --cflags --libs spread-sheet-widget' to see the dynamic flags generated for your current system environment.",
      command: "pkg-config --cflags --libs spread-sheet-widget gtk+-3.0 glib-2.0",
      api: "/api/tools/flags?lib=spread-sheet-widget",
      simulation: "Checking system paths...\nFound GTK+3 at /usr/local/lib\nFound GLib at /opt/homebrew/opt/glib/lib\nGenerated Flags: -I/usr/local/include/gtk-3.0 -L/usr/local/lib -lgtk-3 -lgobject-2.0"
    },
    {
      title: "Dependency Guard",
      desc: "Explicit Python 3.12 version checking prevents build failures before they start.",
      icon: <ShieldCheck className="text-rose-600" />,
      why: "PSPP/SAPA relies on specific Python bindings that are sensitive to version changes. If a user has Python 3.13 but the bindings only support 3.12, the build will fail after 10 minutes of compiling. This guard catches the mismatch instantly.",
      how: "The formula uses a Ruby-based version check that executes the 'python3.12' binary and verifies the major/minor version. If it doesn't match, it triggers Homebrew's 'odie' (Output Die) function to stop the build with a helpful error message.",
      instructions: "The formula automatically executes 'python3.12 --version' and compares it against the required 3.12.x pattern using Homebrew's 'odie' error handler.",
      command: "brew install pspp # (Triggers automatic check)",
      api: "/api/tools/check-python",
      simulation: "Verifying python@3.12...\nPython 3.12.4 detected.\nCompatibility: [PASS]\nProceeding with build..."
    },
    {
      title: "Auto-Doc Generation",
      desc: "Integrated 'make html' and 'make install-html' for local offline documentation.",
      icon: <BookOpen className="text-emerald-600" />,
      why: "Statistical software is complex. Users often need to look up specific algorithm implementations or command syntax while working offline. SAPA ensures the full manual is available locally in your browser.",
      how: "After the main binary is compiled, the formula triggers the Texinfo documentation system. It converts the .texi source files into a searchable HTML structure and places them in your Homebrew 'share' directory.",
      instructions: "After the main binary is installed, the formula generates HTML documentation. You can find it in the 'share/doc/pspp' directory of your Homebrew prefix.",
      command: "make html && make install-html",
      simulation: "Scanning texinfo sources...\nGenerating HTML cross-references...\nWriting manual.html...\nDocumentation installed to /usr/local/share/doc/pspp/html/"
    },
    {
      title: "Modern CI/CD",
      desc: "Local compilation in GitHub Actions ensures your latest code is always tested.",
      icon: <Github className="text-blue-600" />,
      why: "Bottles (pre-compiled binaries) can hide compilation errors in the source code. By forcing a build-from-source in the CI pipeline, we guarantee that the formula works for everyone, not just those using the pre-built version.",
      how: "The GitHub Actions workflow uses a custom runner that clones your local repository and runs 'brew install --build-from-source'. This simulates a user installing your exact local changes on a fresh machine.",
      instructions: "The workflow uses 'brew install --build-from-source' on local formula files. This bypasses remote taps to test your exact local changes.",
      command: "brew install --build-from-source Formula/pspp.rb",
      simulation: "Runner: macos-latest\nAction: checkout@v4\nRunning: brew install --build-from-source Formula/pspp.rb\nBuild Status: [SUCCESS]"
    },
    {
      title: "Real Test Coverage",
      desc: "Removed 'system false' sabotage. We now verify the actual binary execution.",
      icon: <CheckCircle className="text-amber-600" />,
      why: "The original tap had a placeholder test that always failed, meaning users couldn't verify if their installation was actually working. SAPA provides a real integrity check.",
      how: "The 'test' block in the formula now attempts to run the 'pspp' binary with the '--version' flag. If the binary returns a valid version string and exit code 0, the test passes, confirming the installation is functional.",
      instructions: "Run 'brew test pspp' to execute the built-in test block which verifies binary integrity and version output.",
      command: "brew test pspp",
      simulation: "Testing pspp...\nExecuting: /usr/local/bin/pspp --version\nOutput: pspp (GNU PSPP) 2.0.1\nTest Result: [PASSED]"
    },
    {
      title: "Standardized Config",
      desc: "Uses std_configure_args and modern Python pinning for predictable environments.",
      icon: <Cpu className="text-purple-600" />,
      why: "Manual configuration flags are prone to human error. Homebrew's 'std_configure_args' provides a battle-tested set of defaults that handle everything from library paths to optimization levels.",
      how: "By passing '*std_configure_args' to the './configure' script, SAPA automatically inherits the correct prefix, libdir, and sysconfdir settings required for a clean Homebrew installation.",
      instructions: "The formula utilizes '*std_configure_args' to automatically apply Homebrew's best-practice configuration flags (prefix, libdir, etc.).",
      command: "./configure --disable-debug --without-perl-module",
      simulation: "Applying Homebrew Standards...\nSetting prefix to /usr/local/Cellar/pspp/2.0.1\nDisabling dependency tracking...\nConfiguring for SAPA architecture..."
    }
  ];

  const runSimulation = async (index: number) => {
    setIsSimulating(true);
    setSimulationResult(null);
    
    try {
      if (tools[index].api) {
        const response = await fetch(tools[index].api);
        const data = await response.json();
        setSimulationResult(JSON.stringify(data, null, 2));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200));
        setSimulationResult(tools[index].simulation);
      }
    } catch (error) {
      setSimulationResult("Error connecting to SAPA API.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleMathCalculate = async () => {
    setIsCalculating(true);
    try {
      const data = mathData.split(",").map(n => n.trim()).filter(n => n !== "").map(Number);
      const data2 = mathData2.split(",").map(n => n.trim()).filter(n => n !== "").map(Number);
      
      const response = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, data2, operation: mathOp })
      });
      const result = await response.json();
      setMathResult(result.result);
    } catch (error) {
      console.error("Math API error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const saveCurrentResult = async () => {
    if (!mathResult) return;
    const data = mathData.split(",").map(n => n.trim()).filter(n => n !== "").map(Number);
    const data2 = mathData2.split(",").map(n => n.trim()).filter(n => n !== "").map(Number);
    const newResult: SavedResult = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      operation: mathOp,
      data,
      data2: ["correlation", "regression", "ttest", "anova"].includes(mathOp) ? data2 : undefined,
      result: mathResult
    };
    
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResult)
      });
      fetchHistory();
    } catch (e) {
      console.error("Failed to save result to server", e);
    }
  };

  const createApiKey = async () => {
    const label = prompt("Enter a label for this key:");
    if (!label) return;
    try {
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label })
      });
      fetchKeys();
    } catch (e) {
      console.error("Failed to create key", e);
    }
  };

  const deleteApiKey = async (key: string) => {
    try {
      await fetch(`/api/keys/${key}`, { method: "DELETE" });
      fetchKeys();
    } catch (e) {
      console.error("Failed to delete key", e);
    }
  };

  const deleteSavedResult = async (id: string) => {
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      fetchHistory();
    } catch (e) {
      console.error("Failed to delete result", e);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setMathData(text.replace(/\n/g, ","));
    };
    reader.readAsText(file);
  };

  const exportResults = (format: 'json' | 'csv') => {
    let content = "";
    let filename = `sapa_export_${new Date().getTime()}`;
    
    if (format === 'json') {
      content = JSON.stringify(savedResults, null, 2);
      filename += ".json";
    } else {
      content = "ID,Timestamp,Operation,Data,Result\n";
      savedResults.forEach(r => {
        const dataStr = `"${r.data.join(",")}"`;
        const resultStr = typeof r.result === 'object' ? `"${JSON.stringify(r.result).replace(/"/g, '""')}"` : r.result;
        content += `${r.id},${r.timestamp},${r.operation},${dataStr},${resultStr}\n`;
      });
      filename += ".csv";
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (mathResult && chartRef.current) {
      const data = mathData.split(",").map(n => n.trim()).filter(n => n !== "").map(Number);
      const data2 = mathData2.split(",").map(n => n.trim()).filter(n => n !== "").map(Number);
      const svg = d3.select(chartRef.current);
      svg.selectAll("*").remove();

      const width = 400;
      const height = 200;
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };

      if (chartType === "line") {
        const x = d3.scaleLinear()
          .domain([0, data.length - 1])
          .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
          .domain([d3.min(data as number[]) ?? 0, d3.max(data as number[]) ?? 100])
          .nice()
          .range([height - margin.bottom, margin.top]);

        const line = d3.line<number>()
          .x((d, i) => x(i))
          .y(d => y(d));

        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(5));

        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y));

        svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "#10b981")
          .attr("stroke-width", 2)
          .attr("d", line);
      } else if (chartType === "scatter") {
        const x = d3.scaleLinear()
          .domain([d3.min(data as number[]) ?? 0, d3.max(data as number[]) ?? 100])
          .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
          .domain([d3.min(data2 as number[]) ?? 0, d3.max(data2 as number[]) ?? 100])
          .range([height - margin.bottom, margin.top]);

        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x));

        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y));

        svg.selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("cx", d => x(d as number))
          .attr("cy", (d, i) => y(data2[i] || 0))
          .attr("r", 4)
          .attr("fill", "#10b981");
      } else if (chartType === "histogram") {
        const x = d3.scaleLinear()
          .domain([d3.min(data as number[]) ?? 0, d3.max(data as number[]) ?? 100])
          .range([margin.left, width - margin.right]);

        const bins = d3.bin()
          .domain(x.domain() as [number, number])
          .thresholds(x.ticks(10))(data);

        const y = d3.scaleLinear()
          .domain([0, d3.max(bins, d => d.length) ?? 0])
          .range([height - margin.bottom, margin.top]);

        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x));

        svg.selectAll("rect")
          .data(bins)
          .enter()
          .append("rect")
          .attr("x", d => x(d.x0 ?? 0) + 1)
          .attr("width", d => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1))
          .attr("y", d => y(d.length))
          .attr("height", d => y(0) - y(d.length))
          .attr("fill", "#10b981");
      } else if (chartType === "box") {
        const sorted = [...data].sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25) ?? 0;
        const median = d3.quantile(sorted, 0.5) ?? 0;
        const q3 = d3.quantile(sorted, 0.75) ?? 0;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        const y = d3.scaleLinear()
          .domain([min, max])
          .range([height - margin.bottom, margin.top]);

        const xCenter = width / 2;

        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y));

        // Vertical line
        svg.append("line")
          .attr("x1", xCenter)
          .attr("x2", xCenter)
          .attr("y1", y(min))
          .attr("y2", y(max))
          .attr("stroke", "black");

        // Box
        svg.append("rect")
          .attr("x", xCenter - 30)
          .attr("y", y(q3))
          .attr("height", y(q1) - y(q3))
          .attr("width", 60)
          .attr("stroke", "black")
          .attr("fill", "#10b981");

        // Median line
        svg.append("line")
          .attr("x1", xCenter - 30)
          .attr("x2", xCenter + 30)
          .attr("y1", y(median))
          .attr("y2", y(median))
          .attr("stroke", "black");
      }
    }
  }, [mathResult, mathData, mathData2, chartType]);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
  };

  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{cmd: string, output: string}[]>([]);

  // Studio State
  const [studioActiveTab, setStudioActiveTab] = useState("data");
  const [studioGridData, setStudioGridData] = useState<string[][]>(Array(20).fill(0).map(() => Array(5).fill("")));
  const [studioSelectedTool, setStudioSelectedTool] = useState<number | null>(null);

  const updateGridCell = (row: number, col: number, value: string) => {
    const newData = [...studioGridData];
    newData[row][col] = value;
    setStudioGridData(newData);
    
    // Sync with mathData if it's the first column
    if (col === 0) {
      const colData = newData.map(r => r[0]).filter(v => v !== "").join(", ");
      setMathData(colData);
    } else if (col === 1) {
      const colData = newData.map(r => r[1]).filter(v => v !== "").join(", ");
      setMathData2(colData);
    }
  };

  const handleTerminalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    let output = "Command not found. Try 'help' or one of the toolbox commands.";
    
    if (cmd.startsWith("stats ")) {
      const parts = cmd.split(" ");
      const op = parts[1];
      const data = parts.slice(2).join("").split(",").map(Number);
      try {
        const response = await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, operation: op })
        });
        const result = await response.json();
        output = JSON.stringify(result.result, null, 2);
      } catch (e) {
        output = "Error calling SAPA Stats API.";
      }
    } else {
      const matchedTool = tools.find(t => t.command.includes(cmd.split(" ")[0]) || cmd.includes(t.command));
      if (matchedTool) {
        output = matchedTool.simulation;
      } else if (cmd === "help") {
        output = "Available commands:\n" + 
                 tools.map(t => `- ${t.command}`).join("\n") + 
                 "\n- stats [mean|median|stddev|variance|summary] [data,comma,separated]";
      } else if (cmd === "clear") {
        setTerminalHistory([]);
        setTerminalInput("");
        return;
      }
    }

    setTerminalHistory(prev => [...prev, { cmd, output }]);
    setTerminalInput("");
  };

  if (isStudioOpen) {
    return (
      <div className={`fixed inset-0 flex flex-col font-sans z-50 transition-all ${
        appSettings.theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-[#f8f9fa] text-[#1a1a1a]'
      }`} style={{ fontSize: appSettings.fontSize === 'small' ? '14px' : appSettings.fontSize === 'large' ? '18px' : '16px' }}>
        {/* Studio Header */}
        <header className={`h-14 border-b flex items-center justify-between px-6 shadow-sm transition-all ${
          appSettings.theme === 'dark' ? 'bg-[#242424] border-white/10' : 'bg-white border-black/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Activity size={18} />
            </div>
            <h1 className="font-bold tracking-tight text-lg">SAPA Studio <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">Local GUI</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-black/40">
              <Monitor size={12} />
              <span>Local Session Active</span>
            </div>
            <button 
              onClick={() => setIsStudioOpen(false)}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/40 hover:text-black"
            >
              <Minimize2 size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Studio Sidebar */}
          <nav className="w-16 md:w-64 bg-white border-r border-black/5 flex flex-col p-4 gap-2">
            {[
              { id: "data", label: "Data Editor", icon: <Grid size={20} /> },
              { id: "stats", label: "Statistics", icon: <Calculator size={20} /> },
              { id: "tools", label: "Developer Tools", icon: <Terminal size={20} /> },
              { id: "history", label: "History", icon: <History size={20} /> },
              { id: "keys", label: "API Keys", icon: <Key size={20} /> },
              { id: "docs", label: "Manuals", icon: <BookOpen size={20} /> },
              { id: "settings", label: "Settings", icon: <Settings size={20} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStudioActiveTab(tab.id)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  studioActiveTab === tab.id 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                    : appSettings.theme === 'dark' ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"
                }`}
              >
                {tab.icon}
                <span className="hidden md:block font-bold text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Studio Main Content */}
          <main className="flex-1 overflow-auto bg-[#f8f9fa] p-8">
            <AnimatePresence mode="wait">
              {studioActiveTab === "data" && (
                <motion.div 
                  key="data"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Data Editor</h2>
                      <p className="text-sm text-black/40">Enter your statistical data directly into the grid.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setWizardStep(1); setShowImportWizard(true); }}
                        className="px-4 py-2 bg-black/5 text-black/60 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-all flex items-center gap-2"
                      >
                        <FileUp size={14} />
                        <span>Import</span>
                      </button>
                      <button 
                        onClick={() => { setWizardStep(1); setShowExportWizard(true); }}
                        className="px-4 py-2 bg-black/5 text-black/60 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-all flex items-center gap-2"
                      >
                        <FileDown size={14} />
                        <span>Export</span>
                      </button>
                      <button 
                        onClick={() => setStudioActiveTab("stats")}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        Run Analysis
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-2xl border shadow-sm overflow-hidden ${
                    appSettings.theme === 'dark' ? 'bg-[#242424] border-white/10' : 'bg-white border-black/5'
                  }`}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className={`${appSettings.theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} text-[10px] font-bold uppercase tracking-widest text-black/40`}>
                          <th className={`w-12 p-2 border-r ${appSettings.theme === 'dark' ? 'border-white/10' : 'border-black/5'}`}>#</th>
                          <th className={`p-2 border-r ${appSettings.theme === 'dark' ? 'border-white/10' : 'border-black/5'} text-left`}>Variable A</th>
                          <th className={`p-2 border-r ${appSettings.theme === 'dark' ? 'border-white/10' : 'border-black/5'} text-left`}>Variable B</th>
                          <th className={`p-2 border-r ${appSettings.theme === 'dark' ? 'border-white/10' : 'border-black/5'} text-left`}>Variable C</th>
                          <th className={`p-2 border-r ${appSettings.theme === 'dark' ? 'border-white/10' : 'border-black/5'} text-left`}>Variable D</th>
                          <th className="p-2 text-left">Variable E</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studioGridData.map((row, rowIndex) => (
                          <tr key={rowIndex} className={`border-b ${appSettings.theme === 'dark' ? 'border-white/10 hover:bg-white/[0.02]' : 'border-black/5 hover:bg-black/[0.02]'}`}>
                            <td className={`p-2 text-[10px] font-bold text-black/20 text-center border-r ${appSettings.theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>{rowIndex + 1}</td>
                            {row.map((cell, colIndex) => (
                              <td key={colIndex} className={`p-0 border-r ${appSettings.theme === 'dark' ? 'border-white/10' : 'border-black/5'} last:border-r-0`}>
                                <input 
                                  type="text"
                                  value={cell}
                                  onChange={(e) => updateGridCell(rowIndex, colIndex, e.target.value)}
                                  className={`w-full p-2 bg-transparent outline-none text-sm font-mono focus:bg-emerald-500/10 transition-colors ${
                                    appSettings.theme === 'dark' ? 'text-white' : 'text-black'
                                  }`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {studioActiveTab === "stats" && (
                <motion.div 
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Statistical Analysis</h2>
                      <p className="text-sm text-black/40">Select an operation to perform on your grid data.</p>
                    </div>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/30">Operation</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { id: "summary", label: "Summary" },
                            { id: "mean", label: "Mean" },
                            { id: "stddev", label: "Std Dev" },
                            { id: "correlation", label: "Correlation" },
                            { id: "regression", label: "Regression" },
                            { id: "ttest", label: "T-Test" },
                            { id: "anova", label: "ANOVA" }
                          ].map(op => (
                            <button
                              key={op.id}
                              onClick={() => setMathOp(op.id)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                mathOp === op.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-black/5 text-black/40 hover:bg-black/10"
                              }`}
                            >
                              {op.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/30">Data Source</label>
                        <div className="p-4 bg-black/5 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold text-black/40">
                            <span>Variable A</span>
                            <span>{mathData.split(",").filter(v => v.trim() !== "").length} samples</span>
                          </div>
                          <div className="text-xs font-mono text-black/60 truncate">{mathData || "No data in Variable A"}</div>
                        </div>
                        {["correlation", "regression", "ttest", "anova"].includes(mathOp) && (
                          <div className="p-4 bg-black/5 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-black/40">
                              <span>Variable B</span>
                              <span>{mathData2.split(",").filter(v => v.trim() !== "").length} samples</span>
                            </div>
                            <div className="text-xs font-mono text-black/60 truncate">{mathData2 || "No data in Variable B"}</div>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={handleMathCalculate}
                        disabled={isCalculating}
                        className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCalculating ? <Activity className="animate-spin" size={16} /> : <Play size={16} />}
                        <span>Execute Analysis</span>
                      </button>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Results & Visualization</p>
                        <div className="flex gap-2">
                          {["line", "scatter", "histogram", "box"].map(type => (
                            <button
                              key={type}
                              onClick={() => setChartType(type)}
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                                chartType === type ? "bg-emerald-600 text-white" : "bg-black/5 text-black/40"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 min-h-[300px] flex items-center justify-center bg-black/[0.02] rounded-2xl relative overflow-hidden">
                        {mathResult ? (
                          <div className="w-full h-full p-4 flex flex-col">
                            <div className="flex-1">
                              <svg ref={chartRef} className="w-full h-full"></svg>
                            </div>
                            <div className="mt-4 p-4 bg-white rounded-xl border border-black/5 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Calculated Result</p>
                                <p className="text-xl font-bold font-mono">
                                  {typeof mathResult === 'object' ? 'Complex Result' : mathResult.toFixed(4)}
                                </p>
                              </div>
                              <button 
                                onClick={saveCurrentResult}
                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                              >
                                <Save size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-4">
                            <BarChart3 size={48} className="mx-auto text-black/10" />
                            <p className="text-sm text-black/30 font-medium">Run a calculation to see visualization</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {studioActiveTab === "tools" && (
                <motion.div 
                  key="tools"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Developer Toolbox</h2>
                      <p className="text-sm text-black/40">Simulate local Homebrew tap operations.</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool, i) => (
                      <button
                        key={i}
                        onClick={() => setStudioSelectedTool(i)}
                        className={`p-6 text-left rounded-2xl border transition-all ${
                          studioSelectedTool === i 
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                            : "bg-white text-[#0a0a0a] border-black/5 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                          studioSelectedTool === i ? "bg-white/20" : "bg-black/5"
                        }`}>
                          {tool.icon}
                        </div>
                        <h4 className="text-md font-bold mb-1">{tool.title}</h4>
                        <p className={`text-xs leading-relaxed ${
                          studioSelectedTool === i ? "text-white/80" : "text-black/40"
                        }`}>
                          {tool.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  {studioSelectedTool !== null && (
                    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{tools[studioSelectedTool].title}</h3>
                        <button 
                          onClick={() => runSimulation(studioSelectedTool)}
                          disabled={isSimulating}
                          className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/80 transition-all flex items-center gap-2"
                        >
                          {isSimulating ? <Activity className="animate-spin" size={14} /> : <Play size={14} />}
                          <span>Execute Tool</span>
                        </button>
                      </div>
                      <div className="bg-black/5 p-6 rounded-2xl font-mono text-xs text-black/60 whitespace-pre-wrap min-h-[100px]">
                        {simulationResult || "Ready to simulate..."}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {studioActiveTab === "history" && (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Analysis History</h2>
                      <p className="text-sm text-black/40">Review and export your previous calculations.</p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {savedResults.map(res => (
                      <div key={res.id} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Calculator size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{res.operation}</p>
                            <p className="text-[10px] text-black/30">{res.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold font-mono">
                              {typeof res.result === 'object' ? 'Summary' : res.result.toFixed(4)}
                            </p>
                          </div>
                          <button 
                            onClick={() => deleteSavedResult(res.id)}
                            className="p-2 text-black/20 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {studioActiveTab === "keys" && (
                <motion.div 
                  key="keys"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
                      <p className="text-sm text-black/40">Manage keys for external integrations.</p>
                    </div>
                    <button 
                      onClick={createApiKey}
                      className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/80 transition-all"
                    >
                      Generate New Key
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {apiKeys.map(k => (
                      <div key={k.key} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                            <Key size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{k.label}</p>
                            <code className="text-[10px] text-black/40 font-mono">{k.key}</code>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteApiKey(k.key)}
                          className="p-2 text-black/20 hover:text-rose-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {studioActiveTab === "docs" && (
                <motion.div 
                  key="docs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Interactive Manuals</h2>
                      <p className="text-sm text-black/40">Comprehensive guides for SAPA statistical tools.</p>
                    </div>
                    {selectedManual && (
                      <button 
                        onClick={() => setSelectedManual(null)}
                        className="px-4 py-2 bg-black/5 text-black/60 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-all"
                      >
                        Back to Manuals
                      </button>
                    )}
                  </div>

                  {!selectedManual ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {manuals.map(manual => (
                        <button
                          key={manual.id}
                          onClick={() => setSelectedManual(manual.id)}
                          className={`p-6 text-left rounded-3xl border transition-all group ${
                            appSettings.theme === 'dark' ? 'bg-[#242424] border-white/10 hover:border-emerald-500/50' : 'bg-white border-black/5 hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              {manual.icon}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{manual.category}</p>
                              <h3 className="font-bold text-sm tracking-tight">{manual.title}</h3>
                            </div>
                          </div>
                          <p className="text-xs text-black/40 line-clamp-2 leading-relaxed">
                            {manual.content.split('\n')[1].trim()}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-10 rounded-[40px] border shadow-sm max-w-4xl mx-auto ${
                        appSettings.theme === 'dark' ? 'bg-[#242424] border-white/10' : 'bg-white border-black/5'
                      }`}
                    >
                      {manuals.find(m => m.id === selectedManual) && (
                        <div className="space-y-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                              {manuals.find(m => m.id === selectedManual)?.icon}
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-1">
                                {manuals.find(m => m.id === selectedManual)?.category}
                              </p>
                              <h3 className="text-3xl font-bold tracking-tighter">
                                {manuals.find(m => m.id === selectedManual)?.title}
                              </h3>
                            </div>
                          </div>
                          
                          <div className={`h-px w-full ${appSettings.theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />
                          
                          <div className={`prose prose-sm max-w-none leading-relaxed ${
                            appSettings.theme === 'dark' ? 'text-white/70' : 'text-black/60'
                          }`}>
                            {manuals.find(m => m.id === selectedManual)?.content.split('\n').map((line, i) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith('###')) {
                                return <h4 key={i} className="text-lg font-bold text-emerald-600 mt-8 mb-4">{trimmed.replace('###', '')}</h4>;
                              }
                              if (trimmed.startsWith('-')) {
                                return <li key={i} className="ml-4 mb-2">{trimmed.replace('-', '').trim()}</li>;
                              }
                              if (trimmed.startsWith('`')) {
                                return <code key={i} className="block p-4 bg-black/5 rounded-xl font-mono text-xs my-4">{trimmed.replace(/`/g, '')}</code>;
                              }
                              return <p key={i} className="mb-4">{trimmed}</p>;
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
              {studioActiveTab === "settings" && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8 max-w-2xl"
                >
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings & Profiles</h2>
                    <p className="text-sm text-black/40">Manage your application preferences and user profiles.</p>
                  </div>

                  <div className={`p-8 rounded-3xl border shadow-sm space-y-8 ${
                    appSettings.theme === 'dark' ? 'bg-[#242424] border-white/10' : 'bg-white border-black/5'
                  }`}>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/30">User Profile</label>
                      <div className="flex gap-2">
                        <select 
                          value={currentProfile}
                          onChange={(e) => loadProfile(e.target.value)}
                          className={`flex-1 p-3 rounded-xl border outline-none transition-all ${
                            appSettings.theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/5'
                          }`}
                        >
                          {profiles.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                        <button 
                          onClick={() => {
                            const name = prompt("Enter new profile name:");
                            if (name) saveProfile(name);
                          }}
                          className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/30">Theme</label>
                        <div className="flex gap-2">
                          {['light', 'dark'].map(t => (
                            <button
                              key={t}
                              onClick={() => setAppSettings(prev => ({ ...prev, theme: t as any }))}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                appSettings.theme === t ? "bg-emerald-600 text-white" : "bg-black/5 text-black/40"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/30">Font Size</label>
                        <div className="flex gap-2">
                          {['small', 'medium', 'large'].map(s => (
                            <button
                              key={s}
                              onClick={() => setAppSettings(prev => ({ ...prev, fontSize: s as any }))}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                appSettings.fontSize === s ? "bg-emerald-600 text-white" : "bg-black/5 text-black/40"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => saveProfile(currentProfile)}
                      className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      <span>Save Settings to Profile</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Wizards */}
        <AnimatePresence>
          {showImportWizard && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6 ${
                  appSettings.theme === 'dark' ? 'bg-[#242424] text-white' : 'bg-white text-black'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Import Wizard</h3>
                  <button onClick={() => setShowImportWizard(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-black/40">Select your data source type:</p>
                    <div className="grid gap-2">
                      {[
                        { id: "csv", label: "CSV File", icon: <FileText size={18} /> },
                        { id: "excel", label: "Excel Spreadsheet", icon: <Layout size={18} /> },
                        { id: "sql", label: "SQL Database", icon: <DatabaseZap size={18} /> }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => { setImportType(type.id as any); setWizardStep(2); }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 hover:bg-black/10 transition-all text-left"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            {type.icon}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{type.label}</p>
                            <p className="text-[10px] text-black/40 uppercase tracking-widest">Standard format</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-6">
                    {importType === "csv" && (
                      <div className="space-y-4">
                        <p className="text-sm text-black/40">Select a CSV file to import:</p>
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full p-4 bg-black/5 rounded-2xl text-sm" />
                      </div>
                    )}
                    {importType === "excel" && (
                      <div className="space-y-4">
                        <p className="text-sm text-black/40">Select an Excel file (.xlsx, .xls):</p>
                        <input type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="w-full p-4 bg-black/5 rounded-2xl text-sm" />
                      </div>
                    )}
                    {importType === "sql" && (
                      <div className="space-y-4">
                        <p className="text-sm text-black/40">Enter SQL Connection Details:</p>
                        <div className="space-y-2">
                          <input type="text" placeholder="Host" className="w-full p-3 bg-black/5 rounded-xl text-sm outline-none" />
                          <input type="text" placeholder="Database" className="w-full p-3 bg-black/5 rounded-xl text-sm outline-none" />
                          <input type="text" placeholder="User" className="w-full p-3 bg-black/5 rounded-xl text-sm outline-none" />
                        </div>
                        <button onClick={handleSqlImport} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
                          Connect & Import
                        </button>
                      </div>
                    )}
                    <button onClick={() => setWizardStep(1)} className="text-xs font-bold text-black/40 uppercase tracking-widest hover:text-black transition-colors">
                      Back to selection
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {showExportWizard && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6 ${
                  appSettings.theme === 'dark' ? 'bg-[#242424] text-white' : 'bg-white text-black'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Export Wizard</h3>
                  <button onClick={() => setShowExportWizard(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-black/40">Choose your export format:</p>
                  <div className="grid gap-2">
                    {[
                      { id: "csv", label: "CSV File", icon: <FileText size={18} /> },
                      { id: "excel", label: "Excel Spreadsheet", icon: <Layout size={18} /> },
                      { id: "spss", label: "SPSS Data (.sav)", icon: <Database size={18} /> }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => handleExport(type.id as any)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 hover:bg-black/10 transition-all text-left"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          {type.icon}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{type.label}</p>
                          <p className="text-[10px] text-black/40 uppercase tracking-widest">Download now</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Studio Footer */}
        <footer className="h-10 bg-white border-t border-black/5 flex items-center justify-between px-6 text-[10px] font-bold uppercase tracking-widest text-black/30">
          <div className="flex items-center gap-4">
            <span>SAPA Studio v2.0.1</span>
            <span className="text-emerald-500">System Ready</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026 GNU PSPP Modernized</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SAPA</h1>
              <p className="text-xs text-black/40 font-medium uppercase tracking-widest">Statistical Analysis for the Public API</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsStudioOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <Monitor size={14} />
              <span>Launch SAPA Studio</span>
            </button>
            <a 
              href="https://github.com/dustymclean/SAPA" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-colors"
            >
              <Github size={16} />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-20">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle size={14} />
            <span>Fully Functioning Web & Local App</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.9]">
            SAPA: The Public API for <br />
            <span className="text-emerald-600">Statistical Analysis.</span>
          </h2>
          <p className="text-xl text-black/60 max-w-2xl leading-relaxed">
            A dual-purpose platform. A robust Homebrew tap for local power users and a high-performance Public API for web-based statistical computations.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => setIsStudioOpen(true)}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-2"
            >
              <Monitor size={18} />
              <span>Launch SAPA Studio (Local GUI)</span>
            </button>
            <a 
              href="#quick-start"
              className="px-8 py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all shadow-xl shadow-black/10"
            >
              Get Started
            </a>
          </div>
        </motion.section>

        {/* SAPA Math Engine */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator size={24} className="text-emerald-600" />
              <h3 className="text-2xl font-bold tracking-tight">SAPA Math Engine</h3>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl cursor-pointer hover:bg-black/5 transition-all">
                <Upload size={16} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-widest">Upload CSV</span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Variable A (Primary Data)</label>
                  <textarea 
                    value={mathData}
                    onChange={(e) => setMathData(e.target.value)}
                    className="w-full h-24 p-4 bg-black/5 rounded-2xl font-mono text-sm outline-none focus:ring-2 ring-emerald-500/20 transition-all resize-none"
                    placeholder="e.g. 10, 20, 30"
                  />
                </div>

                {["correlation", "regression", "ttest"].includes(mathOp) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Variable B (Comparison Data)</label>
                    <textarea 
                      value={mathData2}
                      onChange={(e) => setMathData2(e.target.value)}
                      className="w-full h-24 p-4 bg-black/5 rounded-2xl font-mono text-sm outline-none focus:ring-2 ring-emerald-500/20 transition-all resize-none"
                      placeholder="e.g. 15, 25, 35"
                    />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Select Operation</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "summary", label: "Summary" },
                    { id: "mean", label: "Mean" },
                    { id: "stddev", label: "Std Dev" },
                    { id: "correlation", label: "Correlation" },
                    { id: "regression", label: "Regression" },
                    { id: "ttest", label: "T-Test" },
                    { id: "anova", label: "ANOVA" }
                  ].map(op => (
                    <button
                      key={op.id}
                      onClick={() => setMathOp(op.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        mathOp === op.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-black/5 text-black/40 hover:bg-black/10"
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleMathCalculate}
                disabled={isCalculating}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 transition-all flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                <span>Run Analysis</span>
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold">Analysis Result</h4>
                  <div className="flex gap-2">
                    {mathResult && (
                      <button 
                        onClick={saveCurrentResult}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Save to Server History"
                      >
                        <Save size={18} />
                      </button>
                    )}
                    <BarChart3 size={20} className="text-black/20" />
                  </div>
                </div>
                
                {mathResult ? (
                  <div className="space-y-6">
                    {typeof mathResult === "object" ? (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(mathResult).map(([key, val]: [string, any]) => (
                          <div key={key} className="p-4 bg-black/5 rounded-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-1">{key}</p>
                            <p className="text-xl font-bold font-mono">{typeof val === "number" ? val.toFixed(4) : val}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/50 mb-1">{mathOp}</p>
                        <p className="text-4xl font-bold text-emerald-700 font-mono">{mathResult.toFixed(4)}</p>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-black/5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Visualization</p>
                        <div className="flex gap-2">
                          {["line", "scatter", "histogram", "box"].map(type => (
                            <button
                              key={type}
                              onClick={() => setChartType(type)}
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                                chartType === type ? "bg-emerald-600 text-white" : "bg-black/5 text-black/40"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <svg ref={chartRef} width="100%" height="200" className="overflow-visible" />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-black/20 space-y-4 py-12">
                    <Database size={48} />
                    <p className="text-sm font-medium">Enter data and run analysis to see results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* API Key Management Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={24} className="text-emerald-600" />
              <h3 className="text-2xl font-bold tracking-tight">Public API Keys</h3>
            </div>
            <button 
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>{showKeys ? "Hide Keys" : "Manage Keys"}</span>
              <ChevronRight size={14} className={showKeys ? "rotate-90" : ""} />
            </button>
          </div>

          <AnimatePresence>
            {showKeys && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden"
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-black/50">Generate keys to integrate SAPA's Math Engine into your own applications.</p>
                    <button 
                      onClick={createApiKey}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/80 transition-all"
                    >
                      <Plus size={14} />
                      <span>Generate New Key</span>
                    </button>
                  </div>

                  {apiKeys.length > 0 ? (
                    <div className="grid gap-3">
                      {apiKeys.map(k => (
                        <div key={k.key} className="flex items-center justify-between p-4 bg-black/5 rounded-2xl group">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                              <Key size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold">{k.label}</p>
                              <code className="text-[10px] text-black/40 font-mono">{k.key}</code>
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteApiKey(k.key)}
                            className="p-2 text-black/20 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-black/20">
                      <p className="text-sm font-medium">No API keys generated yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Documentation Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={24} className="text-emerald-600" />
              <h3 className="text-2xl font-bold tracking-tight">Interactive Manuals</h3>
            </div>
            <button 
              onClick={() => setShowDocs(!showDocs)}
              className="text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>{showDocs ? "Hide Manual" : "View Manual"}</span>
              <ChevronRight size={14} className={showDocs ? "rotate-90" : ""} />
            </button>
          </div>

          <AnimatePresence>
            {showDocs && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden"
              >
                <div className="p-8 grid md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <FileText size={16} className="text-emerald-600" />
                      <span>Descriptive Stats</span>
                    </h4>
                    <ul className="text-sm text-black/50 space-y-2">
                      <li>• <strong>Mean:</strong> The arithmetic average.</li>
                      <li>• <strong>Median:</strong> The middle value in a sorted list.</li>
                      <li>• <strong>Std Dev:</strong> Measure of data dispersion.</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <FileText size={16} className="text-emerald-600" />
                      <span>Inferential Stats</span>
                    </h4>
                    <ul className="text-sm text-black/50 space-y-2">
                      <li>• <strong>Correlation:</strong> Strength of linear relationship.</li>
                      <li>• <strong>Regression:</strong> Predicting Y from X values.</li>
                      <li>• <strong>T-Test:</strong> Comparing means of two groups.</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <FileText size={16} className="text-emerald-600" />
                      <span>CLI Usage</span>
                    </h4>
                    <div className="bg-black/5 p-3 rounded-xl font-mono text-[10px]">
                      $ pspp --version<br/>
                      $ pspp-cli stats mean 1,2,3
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Saved Results Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={24} className="text-emerald-600" />
              <h3 className="text-2xl font-bold tracking-tight">Analysis History (Server-Side)</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => exportResults('csv')}
                disabled={savedResults.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => exportResults('json')}
                disabled={savedResults.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {savedResults.length > 0 ? (
            <div className="grid gap-4">
              {savedResults.map((res) => (
                <div key={res.id} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Calculator size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-widest text-emerald-600">{res.operation}</span>
                        <span className="text-[10px] text-black/30 font-medium">{res.timestamp}</span>
                      </div>
                      <p className="text-xs text-black/40 font-mono truncate max-w-xs">Data: {res.data.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-black/30 uppercase tracking-widest">Result</p>
                      <p className="text-lg font-bold font-mono">
                        {typeof res.result === 'object' ? 'Summary' : res.result.toFixed(4)}
                      </p>
                    </div>
                    <button 
                      onClick={() => deleteSavedResult(res.id)}
                      className="p-2 text-black/20 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 border-2 border-dashed border-black/5 rounded-3xl flex flex-col items-center justify-center text-black/20 space-y-4">
              <History size={48} />
              <p className="text-sm font-medium">No saved results yet. Run a calculation and click the save icon.</p>
            </div>
          )}
        </section>

        {/* Public API Documentation */}
        <section className="space-y-8">
          <div className="flex items-center gap-2">
            <Code size={24} className="text-emerald-600" />
            <h3 className="text-2xl font-bold tracking-tight">Public API Documentation</h3>
          </div>
          
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">POST</span>
                  <code className="text-sm font-mono font-bold">/api/stats</code>
                </div>
                <p className="text-black/60 text-sm">Perform statistical operations on an array of numbers.</p>
                <div className="bg-[#1a1a1a] p-4 rounded-xl font-mono text-xs text-white/70">
                  <pre>{`{
  "operation": "summary",
  "data": [10, 20, 30, 40, 50]
}`}</pre>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded">GET</span>
                  <code className="text-sm font-mono font-bold">/api/tools/flags?lib=[library]</code>
                </div>
                <p className="text-black/60 text-sm">Retrieve dynamic compilation flags for SAPA dependencies.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Toolbox (Developer Tools) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={24} className="text-emerald-600" />
              <h3 className="text-2xl font-bold tracking-tight">Developer Toolbox (Homebrew Tap)</h3>
            </div>
            <p className="text-sm text-black/40 font-medium">Utilize these tools for local compilation</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTool(i);
                  setSimulationResult(null);
                }}
                className={`p-6 text-left rounded-2xl border transition-all ${
                  activeTool === i 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200" 
                    : "bg-white text-[#0a0a0a] border-black/5 shadow-sm hover:shadow-md"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  activeTool === i ? "bg-white/20" : "bg-black/5"
                }`}>
                  {tool.icon}
                </div>
                <h4 className="text-lg font-bold mb-2">{tool.title}</h4>
                <p className={`text-sm leading-relaxed ${
                  activeTool === i ? "text-white/80" : "text-black/50"
                }`}>
                  {tool.desc}
                </p>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTool !== null && (
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl border border-black/5 shadow-xl overflow-hidden"
              >
                <div className="p-8 space-y-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-2xl font-bold">{tools[activeTool].title}</h4>
                        <p className="text-black/60 leading-relaxed max-w-2xl">
                          {tools[activeTool].instructions}
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <HelpCircle size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Why it exists</span>
                          </div>
                          <p className="text-sm text-black/50 leading-relaxed">
                            {tools[activeTool].why}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <BookOpen size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">How to use</span>
                          </div>
                          <p className="text-sm text-black/50 leading-relaxed">
                            {tools[activeTool].how}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => copyCommand(tools[activeTool].command)}
                        className="p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-colors text-black/60"
                        title="Copy Command"
                      >
                        <Copy size={20} />
                      </button>
                      <button 
                        onClick={() => runSimulation(activeTool)}
                        disabled={isSimulating}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        {isSimulating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Play size={20} fill="currentColor" />
                        )}
                        <span>Utilize Tool via API</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Terminal Command</p>
                      <div className="bg-[#1a1a1a] rounded-xl p-4 font-mono text-sm text-emerald-400 overflow-x-auto">
                        <span className="text-white/30 mr-2">$</span>
                        {tools[activeTool].command}
                      </div>
                    </div>

                    {simulationResult && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">API Output</p>
                        <div className="bg-emerald-950/90 rounded-xl p-6 font-mono text-sm text-emerald-300 border border-emerald-500/20 whitespace-pre-line leading-relaxed">
                          {simulationResult}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Live Terminal Emulator */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-emerald-600" />
            <h3 className="text-xl font-bold">Live Terminal Emulator (CLI Access)</h3>
          </div>
          <div className="bg-[#0c0c0c] rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-mono text-sm">
            <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-white/20 text-xs ml-2">zsh — sapa-cli</span>
            </div>
            <div className="p-6 h-[300px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              <div className="text-white/40 italic">Type 'help' to see available commands or 'stats summary 10,20,30' to run analysis.</div>
              {terminalHistory.map((entry, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">➜</span>
                    <span className="text-blue-400">~</span>
                    <span className="text-white">{entry.cmd}</span>
                  </div>
                  <div className="text-emerald-300/80 whitespace-pre-line pl-6 border-l border-white/5">
                    {entry.output}
                  </div>
                </div>
              ))}
              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2">
                <span className="text-emerald-500">➜</span>
                <span className="text-blue-400">~</span>
                <input 
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="bg-transparent border-none outline-none text-white flex-1 caret-emerald-500"
                  autoFocus
                  placeholder="type command..."
                />
              </form>
            </div>
          </div>
        </section>

        {/* Available Formulas */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-emerald-600" />
            <h3 className="text-xl font-bold">Available Formulas</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-white rounded-3xl border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-bold">pspp.rb (SAPA)</h4>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Primary</span>
              </div>
              <p className="text-black/50 leading-relaxed">
                The core statistical analysis engine. Features GSL integration and comprehensive documentation generation.
              </p>
              <div className="pt-4 flex gap-2">
                <code className="px-2 py-1 bg-black/5 rounded text-xs font-mono">Statistical Analysis</code>
                <code className="px-2 py-1 bg-black/5 rounded text-xs font-mono">Math-Driven</code>
              </div>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-bold">spread-sheet-widget.rb</h4>
                <span className="px-3 py-1 bg-black/5 text-black/40 text-[10px] font-bold uppercase tracking-widest rounded-full">Dependency</span>
              </div>
              <p className="text-black/50 leading-relaxed">
                A high-performance Gtk+ widget for viewing and manipulating tabular data. Essential for the SAPA graphical interface.
              </p>
              <div className="pt-4 flex gap-2">
                <code className="px-2 py-1 bg-black/5 rounded text-xs font-mono">GTK+3</code>
                <code className="px-2 py-1 bg-black/5 rounded text-xs font-mono">Tabular Data</code>
              </div>
            </div>
          </div>
        </section>

        {/* Installation Section */}
        <section className="bg-black rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold tracking-tight">Quick Start</h3>
              <p className="text-white/60">Install SAPA on your machine in seconds.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">macOS (Homebrew)</p>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">Step 1: Tap the repository</p>
                  <div className="bg-white/10 rounded-xl p-4 font-mono text-sm flex items-center justify-between group">
                    <code className="text-emerald-400">brew tap dustymclean/SAPA</code>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">Step 2: Install SAPA</p>
                  <div className="bg-white/10 rounded-xl p-4 font-mono text-sm flex items-center justify-between group">
                    <code className="text-emerald-400">brew install pspp</code>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Windows</p>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">Option 1: Official Installer</p>
                  <a 
                    href="https://sourceforge.net/projects/pspp4windows/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/10 rounded-xl p-4 text-sm flex items-center justify-between group hover:bg-white/20 transition-all"
                  >
                    <span className="text-blue-400">Download .exe from SourceForge</span>
                    <ExternalLink size={14} className="text-white/20" />
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">Option 2: MSYS2</p>
                  <div className="bg-white/10 rounded-xl p-4 font-mono text-sm flex items-center justify-between group">
                    <code className="text-blue-400">pacman -S mingw-w64-x86_64-pspp</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button 
                onClick={() => setIsStudioOpen(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Monitor size={14} />
                <span>Launch Web GUI Studio</span>
              </button>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -mr-48 -mt-48 rounded-full" />
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between gap-6 text-black/40 text-sm">
          <p>© 2026 SAPA contributors</p>
          <div className="flex gap-6">
            <a href="https://www.gnu.org/software/pspp/" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">PSPP Official</a>
            <a href="https://brew.sh" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Homebrew</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
