import LoginForm from "../components/auth/LoginForm";

function Login() {
  return (
    // FULL SCREEN BACKGROUND
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      
      {/* CENTERING WRAPPER */}
      <div className="min-h-screen w-full flex items-center justify-center px-6">
        
        {/* CONTENT CONTAINER */}
        <div className="grid w-full max-w-6xl grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT: LOGIN */}
          <div className="flex justify-center">
            <LoginForm />
          </div>

          {/* RIGHT: TEXT */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 text-neutral-300">
            <p className="text-2xl leading-relaxed">
              हितं मितं च रूच्यं च<br />
              भोजनं सप्तधातुभृत्।
            </p>

            <p className="text-sm italic text-neutral-400 max-w-md">
              “Food should be wholesome, in proper quantity, and pleasant —
              nourishing the body’s seven tissues.”
            </p>

            <p className="text-sm text-neutral-500">
              — Charak Samhita
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
