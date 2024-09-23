<script setup lang="ts"></script>

<template>
  <main class="container mx-auto">
    <h1>
      Path Tracer Web
    </h1>
    <ul>
      <li>
        <router-link to="/">
          Home
        </router-link>
      </li>

      <li>
        <router-link to="/works/first-week">
          First Week
        </router-link>
      </li>
    </ul>
  </main>
</template>

<style scoped>
ul li {
  @apply text-3xl;
}
</style>
