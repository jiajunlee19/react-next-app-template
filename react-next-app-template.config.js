module.exports = {
    apps: [{
        name: "react-next-app-template",
        script: "node_modules/next/dist/bin/next",
        args: "start",
        interpreter: "none",
        exec_mode: "cluster",
        cwd: "./",
        env: {
            NODE_ENV: "production",
        },
    }],
};