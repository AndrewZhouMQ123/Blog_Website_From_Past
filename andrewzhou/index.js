const path = require('path')
const fs = require('fs')
const express = require('express')
const app = express()
const DATAPATH = path.join(__dirname + '/data.json')
const PORT = process.env.PORT || 3000

app.use(express.static(__dirname))
app.set('views', './views')
app.set('view engine', 'pug')

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getCurrDate = () => {
    const date = new Date()
    var dateArr = date.toDateString().split(" ")
    dateArr.shift()
    var month = dateArr[0]
    dateArr[0] = dateArr[1]
    dateArr[1] = month
    // Wed Jul 28 2018 => 28 Jul 2018
    return dateArr.join(" ")
}

const formatDataForLibrary = (data) => {
// [
//   {
//     year: 2018,
//     months: [
//         {
//           month: January,
//           blogs: [
//             {
//               date: 12
//               title: "some title",
//               id: 5
//             }
//           ]
//         }
//       ]
//     }
// ]
    var res = []
    // sort year in descending
    Object.keys(data.library).sort((a, b) => b - a).forEach(year => {
        resYear = {}
        resYear.year = year
        resYear.months = []
        yearData = data.library[year]
        // sort months in descending
        Object.keys(yearData).sort((a, b) => monthNames.indexOf(b) - monthNames.indexOf(a)).forEach(month => {
            resMonth = {}
            resMonth.month = month
            resMonth.blogs = []
            monthData = yearData[month].reverse()
            monthData.forEach(blog => {
                resBlog = {}
                resBlog.date = blog.date
                resBlog.id = blog.id
                resBlog.title = data.blogs[blog.id].title
                resMonth.blogs.push(resBlog)
            })
            resYear.months.push(resMonth)
        })
        res.push(resYear)
    })

    return res;
}

const getPopularPosts = data => {
    const posts = Object.keys(data.postData).sort((a, b) => parseInt(data.postData[b]) - parseInt(data.postData[a]))
    console.log(posts)
        // top 2 popular posts
    if (posts.length > 1) {
        console.log("here ------------")
        console.log(posts[0])
        console.log(posts[1])
        return [data.blogs[posts[0]], data.blogs[posts[1]]]
    } else if (posts.length > 0) {
        // return only post
        return [data.blogs[posts[0]]]
    } else {
        return []
    }
}

app.get('/', (req, res) => {
    const file = fs.readFileSync(DATAPATH)
    const data = JSON.parse(file)
    const years = formatDataForLibrary(data)
    const popular = getPopularPosts(data)
    console.log(popular)
    res.render('index', { content: data.blogs, years: years, popular: popular })
})

app.get('/about', (req, res) => {
    const file = fs.readFileSync(DATAPATH)
    const data = JSON.parse(file)
    const years = formatDataForLibrary(data)
    const popular = getPopularPosts(data)
    res.render('about', { content: data.blogs, years: years, popular: popular })
})

app.get('/contact', (req, res) => {
    const file = fs.readFileSync(DATAPATH)
    const data = JSON.parse(file)
    const years = formatDataForLibrary(data)
    const popular = getPopularPosts(data)
    res.render('contact', { content: data.blogs, years: years, popular: popular })
})

app.get('/upload', (req, res) => {
    res.render('upload')
})

app.get('/create', (req, res) => {
    console.log(req.query)
    const file = fs.readFileSync(DATAPATH)
    var data = JSON.parse(file)
    var content = data.blogs
    var library = data.library

    // update blogs
    const currDate = getCurrDate()
    req.query.date = currDate
    req.query.id = content.length
    req.query.author="Andrew Zhou"
    req.query.link = "https://www.youtube.com/embed/" + req.query.videoId
    req.query.thumbnail = "https://img.youtube.com/vi/" + req.query.videoId + "/default.jpg"
    content.push(req.query)

    // update library
    const date = new Date()
    const year = date.getUTCFullYear()
    const month = monthNames[date.getUTCMonth()]
    if (!library[year]) {
        library[year] = {}
        library[year][month] = []
    } else if (library[year] && !library[year][month]) {
        library[year][month] = []
    }
    library[year][month].push({ date: date.getUTCDate(), id: req.query.id })
    data.blogs = content
    data.library = library

    console.log(data)
    fs.writeFileSync(DATAPATH, JSON.stringify(data))
    res.redirect("/")
})

app.get('/blog/:id(\\d+)', (req, res) => {
    console.log(req.params)

    const file = fs.readFileSync(DATAPATH)
    const data = JSON.parse(file)
    var content = data.blogs
    const blog = content[req.params.id]

    // increment # of clicks
    if (!data.postData[req.params.id]) {
        data.postData[req.params.id] = 0
    }
    data.postData[req.params.id]++
    fs.writeFileSync(DATAPATH, JSON.stringify(data))
    res.render('blog', { blog: blog })
})



app.listen(PORT, () => console.log('Blog is up at ' + PORT))