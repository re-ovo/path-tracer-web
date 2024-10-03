<template>
  <main class="container mx-auto p-4">
    <h1>
      Path Tracer Web
    </h1>
    <img src="/result.jpg" alt="render result" class="fixed z-[-1] top-0 left-0 w-screen h-screen" />
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
