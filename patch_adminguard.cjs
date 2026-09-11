const fs = require('fs');
let content = fs.readFileSync('src/components/AdminGuard.tsx', 'utf8');

// Inject the diagnostic state
content = content.replace(
  "export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {",
  `export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  useEffect(() => {
    if (authStatus === 'authenticated_non_admin' && auth.currentUser) {
      auth.currentUser.getIdTokenResult(true).then((token) => {
        const email = auth.currentUser?.email || '';
        const redactedEmail = email ? \`\${email[0]}***@\${email.split('@')[1]}\` : 'N/A';
        const diag = {
          projectId: auth.app.options.projectId,
          appId: auth.app.options.appId,
          uid: auth.currentUser?.uid,
          email: redactedEmail,
          isAdminClaim: token.claims.admin,
          issuedAtTime: token.issuedAtTime,
          expirationTime: token.expirationTime,
          hostname: window.location.hostname,
          pathname: window.location.pathname,
          buildId: 'BUILD_' + (import.meta.env.VITE_BUILD_ID || Date.now())
        };
        setDiagnosticData(diag);
        console.log("=== RUNTIME DIAGNOSTIC ===", diag);
      }).catch(err => {
        console.error("Diagnostic error:", err);
      });
    }
  }, [authStatus, auth.currentUser]);`
);

// Inject the UI panel
content = content.replace(
  "Your account is authenticated but does not have administrator privileges. Please refresh your session or contact the system administrator.\n            </p>\n          </div>\n          <div className=\"space-y-3 pt-2\">",
  `Your account is authenticated but does not have administrator privileges. Please refresh your session or contact the system administrator.
            </p>
          </div>
          {diagnosticData && (
            <div className="text-left bg-slate-900 text-green-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto w-full">
              <h3 className="text-white font-bold mb-2 text-xs">RUNTIME DIAGNOSTIC</h3>
              <p>Project ID: {diagnosticData.projectId}</p>
              <p>App ID: {diagnosticData.appId}</p>
              <p>UID: {diagnosticData.uid}</p>
              <p>Email: {diagnosticData.email}</p>
              <p>Admin Claim: {String(diagnosticData.isAdminClaim)}</p>
              <p>Issued At: {diagnosticData.issuedAtTime}</p>
              <p>Expires At: {diagnosticData.expirationTime}</p>
              <p>Hostname: {diagnosticData.hostname}</p>
              <p>Pathname: {diagnosticData.pathname}</p>
              <p>Build ID: {diagnosticData.buildId}</p>
            </div>
          )}
          <div className="space-y-3 pt-2">`
);

// Change the layout container for the diagnostic panel so it's wider
content = content.replace(
  "<div className=\"bg-white border border-slate-200 p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm text-center\">",
  "<div className=\"bg-white border border-slate-200 p-10 rounded-3xl max-w-2xl w-full space-y-8 shadow-sm text-center\">"
);

fs.writeFileSync('src/components/AdminGuard.tsx', content);
console.log("Patched AdminGuard.tsx");
