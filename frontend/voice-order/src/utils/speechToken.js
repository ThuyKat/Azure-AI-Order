import axios from 'axios'
import Cookie from 'universal-cookie'

export async function getTokenOrRefresh() {
    const cookie = new Cookie()
    const speechToken = cookie.get('speech-token')

    if (speechToken === undefined) {
        try {
            console.log('Fetching token from back-end')
            const res = await axios.get('http://localhost:5000/api/speech/get-speech-token')
            const token = res.data.token
            const region = res.data.region
            cookie.set('speech-token', region + ':' + token, {maxAge: 540, path: '/'}) //9 minutes in seconds
            return { authToken: token, region: region }
        } catch (err) {
            console.log(err.response.data)
            return { authToken: null, error: err.response.data }
        }
    } else {
        const idx = speechToken.indexOf(':')
        return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) }
    }
}