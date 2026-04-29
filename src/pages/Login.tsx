import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [yhId, setYhId] = useState('');
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, yhIdentifier: yhId, password })
      });
      const data = await res.json();

      if (res.ok) {
        await refreshUser();
        navigate('/');
      } else {
        if (data.requiresPassword) {
          setRequiresPassword(true);
        } else {
          setError(data.error || 'Die Anmeldung war nicht erfolgreich.');
          setRequiresPassword(false);
          setPassword('');
        }
      }
    } catch {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vr-gray-light flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-vr-blue px-2">
          Raiffeisenbank Isar-Loisachtal&nbsp;eG
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Reservierungssystem
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-vr-orange">
          
          <div className="mb-6 p-4 bg-blue-50 text-vr-blue-dark rounded-md text-sm">
            <p>Diese Anwendung ist ausschließlich für berechtigte Mitarbeiterinnen und Mitarbeiter der Raiffeisenbank Isar-Loisachtal eG vorgesehen.</p>
            <div className="mt-3 p-3 bg-white border border-blue-200 rounded text-xs text-gray-700">
              <strong>Test-Zugangsdaten:</strong><br />
              <span className="inline-block mt-1">Admin: <b>admin@rileg.de</b> | Kennung: <b>yhadmin</b> | Passwort: <b>Test1234</b></span><br />
              <span className="inline-block mt-1">User: <b>user@rileg.de</b> | Kennung: <b>yhuser</b></span><br />
              <span className="inline-block mt-1">Manager: <b>manager@rileg.de</b> | Kennung: <b>yhmanager</b></span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Bank-E-Mail-Adresse
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  disabled={requiresPassword}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder-gray-400 focus:border-vr-blue focus:outline-none focus:ring-vr-blue sm:text-sm disabled:bg-gray-100"
                  placeholder="vorname.nachname@rileg.de"
                />
              </div>
            </div>

            <div>
              <label htmlFor="yh" className="block text-sm font-medium text-gray-700">
                YH-Kennung
              </label>
              <div className="mt-1">
                <input
                  id="yh"
                  name="yh"
                  type="text"
                  required
                  value={yhId}
                  disabled={requiresPassword}
                  onChange={(e) => setYhId(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder-gray-400 focus:border-vr-blue focus:outline-none focus:ring-vr-blue sm:text-sm disabled:bg-gray-100"
                  placeholder="z.B. YH1234"
                />
              </div>
            </div>

            {requiresPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Admin-Passwort
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder-gray-400 focus:border-vr-blue focus:outline-none focus:ring-vr-blue sm:text-sm"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-vr-orange py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-vr-orange-dark focus:outline-none focus:ring-2 focus:ring-vr-orange focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Prüfung...' : (requiresPassword ? 'Als Admin anmelden' : 'Anmelden')}
              </button>
            </div>
          </form>

          <div className="mt-6">
             <p className="text-xs text-gray-500 text-center">
               Mit der Anmeldung bestätige ich, dass ich zur Nutzung berechtigt bin und die Datenschutzhinweise zur Kenntnis genommen habe.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
