module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "overrides": [],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "semi": [
            "error",
            "always"
        ],
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1
            }
        ],
        "quotes": [
            "error",
            "double"
        ],
        "brace-style": [
            "error",
            "stroustrup"
        ]
    }
};