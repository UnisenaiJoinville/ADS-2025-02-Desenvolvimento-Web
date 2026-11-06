Vue.createApp({
  data: () => ({
    count: 0,
    name: "",
    email: "",
    visible: true,
    item: "",
    items: [],
  }),
  computed: {
    double() {
      return this.count * 2;
    },
  },
  methods: {
    add() {
      if (this.item.trim()) {
        this.items.push(this.item.trim());
        this.item = "";
      }
    },
  },
}).mount("#app");
