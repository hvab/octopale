# octopale
> Markup builder for BEM projects with nested structure

[![GitHub Release](https://img.shields.io/github/release/palegrow/octopale.svg?style=flat)](https://github.com/palegrow/octopale/releases)
![dependencies](https://david-dm.org/palegrow/octopale.svg)

## Install
```sh
git clone https://github.com/palegrow/octopale.git new-project
cd new-project
npm install
```

## Usage
Basic developer usage
```sh
export PATH=./node_modules/.bin:$PATH

# build
gulp bemBuild [--path projects/stub] [--prod]

# build and watch
gulp bemWatch [--path projects/stub] [--prod]
```

## API

`--path` is for nested projects.

`--prod` is for production (inline assets, minify CSS and images, off sourcemaps).

## Работа с картинками и другими сопутсвующими файлами

Все картинки (файлы шрифтов и пр.), которые прописаны в CSS в свойстве `url()`, не нуждаются в дополнительном объявлении.

Картинки же, которые вставляются тегом `img` в HTML, надо добавлять в зависимости (deps.js).

В ситуации, когда картинка названа также как и блок, и вставляется с помощью `url()`, она задвоится - будет заинлайнена в итоговом CSS и лежать в папке бандла.
