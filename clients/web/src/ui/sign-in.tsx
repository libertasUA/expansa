import { type FormEvent, type JSX, useState } from 'react';

import { CredentialsError, useSession } from '../core/session';

/**
 * The credentials are a placeholder — real authentication is Apple, Google and
 * Steam — but everything around them is not. The form, the stored token, being
 * returned here on a 401: all of it survives the stub.
 */
export function SignIn(): JSX.Element {
  const { signIn, register } = useSession();
  const [creating, setCreating] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(event: FormEvent): void {
    event.preventDefault();
    setBusy(true);
    setError(null);

    void (creating ? register(login, password) : signIn(login, password))
      .catch((cause: unknown) => {
        setError(
          cause instanceof CredentialsError
            ? cause.message
            : 'Could not reach the server',
        );
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <form className="sign-in panel" onSubmit={submit}>
      <h1>{creating ? 'New survivor' : 'Sign in'}</h1>

      <label>
        <span>Login</span>
        <input
          value={login}
          onChange={(event) => {
            setLogin(event.target.value);
          }}
          autoComplete="username"
          autoFocus
        />
      </label>

      <label>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          autoComplete={creating ? 'new-password' : 'current-password'}
        />
      </label>

      <button type="submit" disabled={busy}>
        {creating ? 'Wake the ark' : 'Enter'}
      </button>

      {error !== null && <p className="error">{error}</p>}

      <button
        type="button"
        className="link"
        onClick={() => {
          setCreating(!creating);
          setError(null);
        }}
      >
        {creating ? 'I already have an ark' : 'I am new here'}
      </button>
    </form>
  );
}
