module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist-firefox/**",
      "outputs/**",
      "eslint.config.cjs"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        window: "readonly",
        document: "readonly",
        Node: "readonly",
        NodeFilter: "readonly",
        FileReader: "readonly",
        Blob: "readonly",
        IntersectionObserver: "readonly",
        ResizeObserver: "readonly",
        alert: "readonly",
        confirm: "readonly",
        browser: "readonly",
        chrome: "readonly",
        browserAPI: "readonly"
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": ["error", { "destructuring": "all" }],
      "curly": ["error", "all"]
    }
  },
  {
    files: ["background.js", "content.js", "controls.js", "minimap.js", "popup.js", "pages-list.js"],
    languageOptions: {
      globals: {
        debugLog: "readonly",
        createHighlightControls: "readonly",
        refreshHighlightControlsColors: "readonly",
        setSelectionControlsVisibility: "readonly",
        removeHighlight: "readonly",
        changeHighlightColor: "readonly",
        activeHighlightElement: "readonly",
        highlightControlsContainer: "readonly",
        hideHighlightControls: "readonly",
        showControlUi: "readonly",
        MinimapManager: "readonly",
        highlightSelectedText: "readonly",
        createHighlightWithColor: "readonly",
        currentColors: "readonly",
        getMessage: "readonly"
      }
    }
  },
  {
    files: ["scripts/**/*.js", "playwright.config.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly"
      }
    }
  },
  {
    files: ["mocks/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        module: "readonly",
        jest: "readonly"
      }
    }
  },
  {
    files: ["e2e-tests/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        require: "readonly",
        __dirname: "readonly",
        getComputedStyle: "readonly"
      }
    }
  }
];
