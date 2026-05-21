/**
 * ProxyPal - Shared UI Components (modals, toast, chat)
 * Injected into #shared-components on each page
 */

$(document).ready(function () {
  renderSharedComponents();
});

function renderSharedComponents() {
  const container = $("#shared-components");
  if (!container.length) return;

  container.html(`
    <!-- Login Modal -->
    <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="loginModalLabel"><i class="fa-solid fa-right-to-bracket me-2"></i>Login</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="loginForm">
            <div class="modal-body">
              <div class="mb-3">
                <label for="loginEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="loginEmail" required placeholder="you@email.com">
              </div>
              <div class="mb-3">
                <label for="loginPassword" class="form-label">Password</label>
                <input type="password" class="form-control" id="loginPassword" required placeholder="••••••••">
              </div>
              <p class="small text-secondary">Demo: any email works. No backend required.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-glass" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-gradient">Login</button>
            </div>
          </form>
          <div class="px-4 pb-3 text-center">
            <small>Don't have an account? <a href="#" data-bs-toggle="modal" data-bs-target="#registerModal" data-bs-dismiss="modal">Register</a></small>
          </div>
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div class="modal fade" id="registerModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fa-solid fa-user-plus me-2"></i>Register</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="registerForm">
            <div class="modal-body">
              <div class="mb-3">
                <label for="registerName" class="form-label">Full Name</label>
                <input type="text" class="form-control" id="registerName" required>
              </div>
              <div class="mb-3">
                <label for="registerEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="registerEmail" required>
              </div>
              <div class="mb-3">
                <label for="registerPassword" class="form-label">Password</label>
                <input type="password" class="form-control" id="registerPassword" required minlength="4">
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-gradient">Create Account</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Global Toast -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:1200;">
      <div id="globalToast" class="toast align-items-center text-bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <i class="toast-icon fa-solid fa-circle-check"></i>
            <span class="toast-message">Success!</span>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    </div>

    <!-- Chat Widget -->
    <div class="chat-widget" id="chatWidget">
      <div class="chat-panel glass-card" id="chatPanel">
        <div class="chat-header"><i class="fa-solid fa-comments me-2"></i>ProxyPal Support</div>
        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg bot">Hi! How can we help you today?</div>
        </div>
        <div class="chat-input-area">
          <input type="text" class="form-control form-control-sm" id="chatInput" placeholder="Type a message...">
          <button class="btn btn-gradient btn-sm" id="chatSend"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
      <button class="chat-toggle" id="chatToggle" aria-label="Open chat"><i class="fa-solid fa-comment-dots"></i></button>
    </div>
  `);
}
