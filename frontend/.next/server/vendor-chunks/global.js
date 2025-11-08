/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/global";
exports.ids = ["vendor-chunks/global"];
exports.modules = {

/***/ "(ssr)/./node_modules/global/document.js":
/*!*****************************************!*\
  !*** ./node_modules/global/document.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("var topLevel = typeof global !== 'undefined' ? global :\n    typeof window !== 'undefined' ? window : {}\nvar minDoc = __webpack_require__(/*! min-document */ \"(ssr)/./node_modules/min-document/index.js\");\n\nvar doccy;\n\nif (typeof document !== 'undefined') {\n    doccy = document;\n} else {\n    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];\n\n    if (!doccy) {\n        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;\n    }\n}\n\nmodule.exports = doccy;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ2xvYmFsL2RvY3VtZW50LmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQSxhQUFhLG1CQUFPLENBQUMsZ0VBQWM7O0FBRW5DOztBQUVBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92aWRlby1zbmFwc2hvdC1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy9nbG9iYWwvZG9jdW1lbnQuanM/MGI4YSJdLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgdG9wTGV2ZWwgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6XG4gICAgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB7fVxudmFyIG1pbkRvYyA9IHJlcXVpcmUoJ21pbi1kb2N1bWVudCcpO1xuXG52YXIgZG9jY3k7XG5cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgZG9jY3kgPSBkb2N1bWVudDtcbn0gZWxzZSB7XG4gICAgZG9jY3kgPSB0b3BMZXZlbFsnX19HTE9CQUxfRE9DVU1FTlRfQ0FDSEVANCddO1xuXG4gICAgaWYgKCFkb2NjeSkge1xuICAgICAgICBkb2NjeSA9IHRvcExldmVsWydfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0J10gPSBtaW5Eb2M7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY2N5O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/global/document.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/global/window.js":
/*!***************************************!*\
  !*** ./node_modules/global/window.js ***!
  \***************************************/
/***/ ((module) => {

eval("var win;\n\nif (typeof window !== \"undefined\") {\n    win = window;\n} else if (typeof global !== \"undefined\") {\n    win = global;\n} else if (typeof self !== \"undefined\"){\n    win = self;\n} else {\n    win = {};\n}\n\nmodule.exports = win;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ2xvYmFsL3dpbmRvdy5qcyIsIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0EsRUFBRTtBQUNGO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92aWRlby1zbmFwc2hvdC1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy9nbG9iYWwvd2luZG93LmpzPzkyZTgiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIHdpbjtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB3aW4gPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB3aW4gPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKXtcbiAgICB3aW4gPSBzZWxmO1xufSBlbHNlIHtcbiAgICB3aW4gPSB7fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3aW47XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/global/window.js\n");

/***/ })

};
;