<?php
session_start();
$error = '';
$success = '';
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'voicelab_db';

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Database connection failed. Please ensure XAMPP MySQL is running and you have created the 'voicelab_db' database. Error: " . $e->getMessage());
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    if (isset($_POST['register'])) {
        $username = trim($_POST['username']);
        $password = trim($_POST['password']);
        
        if(empty($username) || empty($password)) {
            $error = "Please fill in all fields.";
        } else {
            $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->rowCount() > 0) {
                $error = "Username already taken. Please choose another.";
            } else {
                $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
                if ($stmt->execute([$username, $password])) {
                    $success = "Registration successful! You can now log in.";
                } else {
                    $error = "Registration failed. Please try again.";
                }
            }
        }
    }
    
    if (isset($_POST['login'])) {
        $username = trim($_POST['username']);
        $password = trim($_POST['password']);

        if(empty($username) || empty($password)) {
            $error = "Please fill in all fields.";
        } else {
            $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
            $stmt->execute([$username]);
            
            if ($stmt->rowCount() == 1) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($password === $user['password']) {
                    $_SESSION['loggedin'] = true;
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    header("location: index.html");
                    exit;
                } else {
                    $error = "Invalid username or password.";
                }
            } else {
                $error = "Invalid username or password.";
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Lab - Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
    <style>
        .fullpage {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100vw;
            padding: 20px;
        }
        
        .center {
            width: 100%;
            max-width: 420px;
            padding: 40px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .topsection {
            text-align: center;
            margin-bottom: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .topsection .logo {
            font-size: 2rem;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .topsection .subtitle {
            color: var(--text-sec);
        }
        
        .login6 {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .formgroup {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .formgroup label {
            color: var(--text-sec);
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .form5 {
            width: 100%;
            background: rgba(0,0,0,0.2) !important;
            padding: 12px 16px !important;
        }
        
        .login4 {
            width: 100%;
            margin-top: 10px;
            padding: 14px;
            font-size: 1rem;
        }
        
        .login3 {
            margin-top: 24px;
            text-align: center;
            font-size: 0.9rem;
            color: var(--text-sec);
        }
        
        .login3 a {
            color: var(--accent-2);
            text-decoration: none;
            cursor: pointer;
            font-weight: 600;
        }
        
        .login3 a:hover {
            text-decoration: underline;
        }
        
        .alert {
            padding: 12px;
            border-radius: var(--radius-sm);
            margin-bottom: 20px;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notificationbox1 {
            background: rgba(239, 68, 68, 0.1);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .notificationbox {
            background: rgba(16, 185, 129, 0.1);
            color: #6ee7b7;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div class="animations">
        <div class="circle circle1"></div>
        <div class="circle circle2"></div>
        <div class="circle circle3"></div>
    </div>

    <div class="fullpage">
        <div class="glassbox center in" id="view">
            <div class="topsection">
                <div class="logo">
                    <img src="icon.png" alt="Voice Lab Logo" class="image" style="width: 48px; height: 48px;">
                    <span>Voice Lab</span>
                </div>
                <p class="subtitle" id="logo">Welcome back. Please login to your account.</p>
            </div>

            <?php if(!empty($error)): ?>
                <div class="alert notificationbox1">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <?php echo $error; ?>
                </div>
            <?php endif; ?>
            
            <?php if(!empty($success)): ?>
                <div class="alert notificationbox">
                    <i class="fa-solid fa-circle-check"></i>
                    <?php echo $success; ?>
                </div>
            <?php endif; ?>

            <form action="login.php" method="post" class="login6" id="login">
                <div class="formgroup">
                    <label for="login1">Username</label>
                    <input type="text" id="login1" name="username" class="form5" required autofocus>
                </div>
                <div class="formgroup">
                    <label for="login2">Password</label>
                    <input type="password" id="login2" name="password" class="form5" required>
                </div>
                <button type="submit" name="login" class="highlightbutton login4">Login</button>
                <div class="login3">
                    Don't have an account? <a id="register">Register here</a>
                </div>
            </form>

            <form action="login.php" method="post" class="login6 hidden" id="registering">
                <div class="formgroup">
                    <label for="username">Choose a Username</label>
                    <input type="text" id="username" name="username" class="form5" required>
                </div>
                <div class="formgroup">
                    <label for="password">Choose a Password</label>
                    <input type="password" id="password" name="password" class="form5" required>
                </div>
                <button type="submit" name="register" class="highlightbutton login4">Quick Register</button>
                <div class="login3">
                    Already registered? <a id="login5">Login here</a>
                </div>
            </form>
        </div>
    </div>

    <script>
        const loginForm = document.getElementById('login');
        const registerForm = document.getElementById('registering');
        const showRegisterBtn = document.getElementById('register');
        const showLoginBtn = document.getElementById('login5');
        const formSubtitle = document.getElementById('logo');

        showRegisterBtn.addEventListener('click', () => {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            formSubtitle.innerText = "Create a quick account to see the login work.";
        });

        showLoginBtn.addEventListener('click', () => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            formSubtitle.innerText = "Welcome back. Please login to your account.";
        });

        <?php if(isset($_POST['register'])): ?>
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            formSubtitle.innerText = "Create a quick account to see the login work.";
        <?php endif; ?>
    </script>
</body>
</html>
