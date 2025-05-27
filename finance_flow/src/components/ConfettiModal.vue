<template>
  <transition name="confetti-modal-fade">
    <div v-if="visible" class="confetti-modal-overlay" @click.self="closeModal">
      <div class="confetti-modal-content" role="dialog" aria-modal="true" aria-label="Congratulations Modal">
        <div class="confetti-emoji-set">
          <span class="confetti-emoji" v-for="index in 10" :key="index" :style="{ left: (index * 8) + '%', animationDelay: `${(0.3 * index).toFixed(2)}s` }">🎉</span>
          <span class="confetti-emoji" v-for="index in 7" :key="'star'+index" :style="{ left: (index * 12) + 5 + '%', animationDelay: `${(0.23 * index + 0.07).toFixed(2)}s` }">✨</span>
        </div>
        <div class="congrats-msg">
          <h1>Congratulations! 🎊</h1>
          <p>You've reached your savings goal!<br/>Way to go on your financial journey!</p>
          <button type="button" class="close-btn" @click="closeModal" aria-label="Close popup">Close</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
// PUBLIC_INTERFACE
defineProps<{ visible: boolean }>()

const emit = defineEmits(['close'])

// PUBLIC_INTERFACE
function closeModal() {
  emit('close')
}
</script>

<style scoped>
.confetti-modal-overlay {
  position: fixed;
  z-index: 10000;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(36,19,80, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.confetti-modal-content {
  position: relative;
  background: linear-gradient(135deg, #fff 90%, #ede9fc 100%);
  color: #251259;
  box-shadow: 0 10px 42px 0 rgba(58,47,130,0.17);
  border-radius: 26px;
  min-width: 350px;
  max-width: 95vw;
  padding: 2.7em 2em 2.2em 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confetti-emoji-set {
  position: absolute;
  width: 96%;
  height: 100%;
  left: 2%;
  top: -26px;
  pointer-events: none;
}

.confetti-emoji {
  position: absolute;
  font-size: 2.2em;
  transform: translateY(-40px) scale(1.05);
  animation: floatDown 1.62s cubic-bezier(0.71,0.01,0.44,1) forwards, wiggle 2.6s linear infinite;
  opacity: 0.8;
}

@keyframes floatDown {
  0% { opacity:0; transform:translateY(-40px) scale(0.94) rotateZ(-5deg);}
  40% { opacity:0.85; }
  100% { opacity:1; transform: translateY(110px) scale(1.1) rotateZ(12deg);}
}
@keyframes wiggle {
  0%, 100% { transform: translateY(110px) scale(1.1) rotateZ(12deg);}
  18% { transform: translateY(118px) scale(1.11) rotateZ(-6deg);}
  50% { transform: translateY(106px) scale(1.12) rotateZ(5deg);}
  78% { transform: translateY(112px) scale(1.1) rotateZ(-9deg);}
}

.congrats-msg {
  position: relative;
  margin-top: 2.2em;
  margin-bottom: 1.5em;
  z-index: 2;
}
.congrats-msg h1 {
  font-size: 2.05em;
  color: #6C3EFF;
  font-weight: 800;
  text-shadow: 0 1px 7px #ded3f7, 0 1px 3px #cdbeeb;
}
.congrats-msg p {
  font-size: 1.17em;
  margin: 1em auto;
  color: #432d7c;
  font-weight: 500;
}
.close-btn {
  margin-top: 1em;
  border: none;
  background: #6C3EFF;
  color: #fff;
  padding: 0.6em 2.2em;
  font-size: 1.16em;
  font-weight: 700;
  border-radius: 18px;
  cursor: pointer;
  transition: background 0.18s;
  box-shadow: 0 2px 12px 0 #a48bfdb6;
}
.close-btn:hover {
  background: #5141ac;
}

@media (max-width:530px) {
  .confetti-modal-content { min-width: 97vw; padding: 1.6em 1em 1.1em 1em;}
  .confetti-emoji { font-size: 1.19em; }
  .congrats-msg h1 { font-size: 1.15em;}
}

/* Modal overlay fade and scale pop animation */
.confetti-modal-fade-enter-active, .confetti-modal-fade-leave-active {
  transition: opacity 0.32s cubic-bezier(.6,.01,.68,1.08);
}
.confetti-modal-fade-enter-from,
.confetti-modal-fade-leave-to {
  opacity: 0;
}
</style>
